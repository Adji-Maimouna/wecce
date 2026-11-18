<?php

namespace App\Services\Points;

use App\Models\Annonce;
use App\Models\ComptePoints;
use App\Models\ConfigurationPlateforme;
use App\Models\MouvementPoints;
use App\Support\WecceClock;
use App\Support\WecceCodes;
use Illuminate\Support\Facades\DB;

/**
 * Service de fonte mensuelle parallèle (5 % le 1er du mois sur les soldes ET sur les prix).
 * Même règle d'arrondi (round) sur les points et sur les prix dans la même transaction.
 * Idempotence garantie par periode_fonte (AAAA-MM) et l'index unique (compte_id, periode_fonte).
 */
class AppliquerFonte
{
    public static function afterFonte(int $value, int $months = 1, float $rate = 0.05): int
    {
        return (int) round($value * pow(1 - $rate, $months));
    }

    /**
     * @return array{accounts: int, articles: int}
     */
    public function execute(string $at): array
    {
        return DB::transaction(function () use ($at) {
            $config = ConfigurationPlateforme::query()->lockForUpdate()->findOrFail(1);
            $periode = WecceClock::monthKey($at);

            if ($config->derniere_fonte_le && WecceClock::monthKey($config->derniere_fonte_le) === $periode) {
                return [
                    'accounts' => 0,
                    'articles' => 0,
                ];
            }

            $rate = (float) ($config->taux_fonte ?: 0.05);
            $ratePercent = (int) round($rate * 100);
            $dateFonte = WecceClock::dateOf($at);

            $accountsCount = 0;
            $comptes = ComptePoints::query()
                ->where('statut', 'ACTIF')
                ->where('solde', '>', 0)
                ->lockForUpdate()
                ->get();

            foreach ($comptes as $compte) {
                $alreadyApplied = MouvementPoints::query()
                    ->where('compte_id', $compte->id)
                    ->where('periode_fonte', $periode)
                    ->exists();

                if ($alreadyApplied) {
                    continue;
                }

                $before = (int) $compte->solde;
                $after = self::afterFonte($before, 1, $rate);
                $drop = $before - $after;

                if ($drop > 0) {
                    MouvementPoints::query()->create([
                        'compte_id' => $compte->id,
                        'type' => 'FONTE',
                        'montant' => -$drop,
                        'taux_applique' => $rate,
                        'periode_fonte' => $periode,
                        'solde_apres' => $after,
                        'libelle' => "{$ratePercent} % de " . WecceCodes::num($before),
                        'effectue_le' => $at,
                    ]);

                    $compte->update([
                        'solde' => $after,
                        'derniere_fonte_le' => $dateFonte,
                        'dernier_mouvement_le' => $at,
                    ]);

                    $accountsCount++;
                }
            }

            $articlesCount = 0;
            $annonces = Annonce::query()
                ->whereIn('statut', ['A_PHOTOGRAPHIER', 'EN_LIGNE', 'RESERVEE'])
                ->lockForUpdate()
                ->get();

            foreach ($annonces as $annonce) {
                $afterPrice = self::afterFonte((int) $annonce->prix_courant, 1, $rate);
                $annonce->update([
                    'prix_courant' => max(1, $afterPrice),
                    'derniere_fonte_le' => $dateFonte,
                ]);
                $articlesCount++;
            }

            $config->update([
                'derniere_fonte_le' => $at,
                'derniere_fonte_comptes' => $accountsCount,
                'derniere_fonte_annonces' => $articlesCount,
                'mis_a_jour_le' => $at,
            ]);

            return [
                'accounts' => $accountsCount,
                'articles' => $articlesCount,
            ];
        });
    }
}

<?php

namespace App\Services\Points;

use App\Models\ComptePoints;
use App\Models\ConfigurationPlateforme;
use App\Models\MouvementPoints;
use App\Models\Renoncement;
use Illuminate\Support\Facades\DB;

/**
 * Service dédié au crédit de points lors de la signature du renoncement en boutique.
 * Seul autorisé à écrire des mouvements CREDIT_DEPOT et BONUS dans mouvement_points.
 */
class CrediterDepot
{
    /**
     * @return array{balanceAfter: int, bonus: int, bonusRate: float}
     */
    public function execute(
        ComptePoints $compte,
        Renoncement $renoncement,
        string $depotReference,
        string $shortDeviceName,
        int $valeurReprise,
        string $at
    ): array {
        return DB::transaction(function () use ($compte, $renoncement, $depotReference, $shortDeviceName, $valeurReprise, $at) {
            $compte = ComptePoints::query()->lockForUpdate()->findOrFail($compte->id);
            $config = ConfigurationPlateforme::query()->lockForUpdate()->findOrFail(1);

            $bonusOn = $config->bonus_actif && $config->bonus_consomme < $config->bonus_quota;
            $bonusRatePercent = $bonusOn ? (int) round($config->bonus_taux * 100) : 0;
            $bonus = $bonusRatePercent > 0 ? (int) round(($valeurReprise * $bonusRatePercent) / 100) : 0;

            // 1. Mouvement principal : CREDIT_DEPOT
            $newBalance = $compte->solde + $valeurReprise;
            MouvementPoints::query()->create([
                'compte_id' => $compte->id,
                'type' => 'CREDIT_DEPOT',
                'montant' => $valeurReprise,
                'solde_apres' => $newBalance,
                'libelle' => "{$shortDeviceName}, renoncement signé en boutique",
                'effectue_le' => $at,
                'renoncement_id' => $renoncement->id,
            ]);

            // 2. Mouvement bonus de lancement (si applicable)
            if ($bonus > 0) {
                $newBalance += $bonus;
                MouvementPoints::query()->create([
                    'compte_id' => $compte->id,
                    'type' => 'BONUS',
                    'montant' => $bonus,
                    'taux_applique' => $config->bonus_taux,
                    'solde_apres' => $newBalance,
                    'libelle' => "+ {$bonusRatePercent} % sur la reprise du dépôt {$depotReference}",
                    'effectue_le' => $at,
                ]);

                $config->update([
                    'bonus_consomme' => $config->bonus_consomme + 1,
                ]);
            }

            $compte->update([
                'solde' => $newBalance,
                'dernier_mouvement_le' => $at,
            ]);

            return [
                'balanceAfter' => $newBalance,
                'bonus' => $bonus,
                'bonusRate' => $bonusRatePercent,
            ];
        });
    }
}

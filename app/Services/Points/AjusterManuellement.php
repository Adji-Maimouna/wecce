<?php

namespace App\Services\Points;

use App\Exceptions\RuleViolationException;
use App\Models\ComptePoints;
use App\Models\JournalAdministration;
use App\Models\MouvementPoints;
use App\Models\User;
use App\Support\WecceCodes;
use Illuminate\Support\Facades\DB;

/**
 * Service d'ajustement manuel d'un solde de points par un administrateur.
 * Journalise obligatoirement l'action dans mouvement_points ET journal_administration.
 */
class AjusterManuellement
{
    public function execute(
        ComptePoints $compte,
        string $numeroCarte,
        string $direction,
        int $amount,
        string $reason,
        User $admin,
        string $at,
        ?string $ip = null
    ): int {
        if ($amount <= 0 || mb_strlen(trim($reason), 'UTF-8') < 10) {
            throw new RuleViolationException('ajustement-invalide', 'Montant positif et motif explicite (10 caractères min.) requis.');
        }

        return DB::transaction(function () use ($compte, $numeroCarte, $direction, $amount, $reason, $admin, $at, $ip) {
            $compte = ComptePoints::query()->lockForUpdate()->findOrFail($compte->id);
            $before = (int) $compte->solde;
            $signed = $direction === 'debit' ? -$amount : $amount;
            $after = $before + $signed;

            if ($after < 0) {
                throw new RuleViolationException('solde-negatif', 'Le solde ne peut pas devenir négatif.');
            }

            MouvementPoints::query()->create([
                'compte_id' => $compte->id,
                'type' => 'AJUSTEMENT',
                'montant' => $signed,
                'solde_apres' => $after,
                'libelle' => trim($reason),
                'effectue_le' => $at,
                'effectue_par' => $admin->id,
            ]);

            $compte->update([
                'solde' => $after,
                'dernier_mouvement_le' => $at,
            ]);

            JournalAdministration::query()->create([
                'administrateur_id' => $admin->id,
                'utilisateur_id' => $admin->id,
                'auteur_libelle' => $admin->auditSignature($ip),
                'action' => 'AJUSTEMENT_POINTS',
                'cible_type' => 'compte_points',
                'cible_id' => $compte->id,
                'cible_libelle' => "Compte {$numeroCarte}",
                'changement' => WecceCodes::num($before) . ' → ' . WecceCodes::num($after) . ' pts',
                'avant' => ['solde' => $before],
                'apres' => ['solde' => $after],
                'motif' => trim($reason),
                'effectue_le' => $at,
                'adresse_ip' => $ip,
            ]);

            return $after;
        });
    }
}

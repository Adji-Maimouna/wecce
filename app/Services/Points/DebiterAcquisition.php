<?php

namespace App\Services\Points;

use App\Exceptions\RuleViolationException;
use App\Models\Acquisition;
use App\Models\ComptePoints;
use App\Models\MouvementPoints;
use Illuminate\Support\Facades\DB;

/**
 * Service dédié au débit des points lors d'une acquisition sur le marché.
 */
class DebiterAcquisition
{
    public function execute(
        ComptePoints $compte,
        Acquisition $acquisition,
        string $articleName,
        int $pointsToDebit,
        string $at
    ): int {
        if ($pointsToDebit <= 0) {
            return $compte->solde;
        }

        return DB::transaction(function () use ($compte, $acquisition, $articleName, $pointsToDebit, $at) {
            $compte = ComptePoints::query()->lockForUpdate()->findOrFail($compte->id);
            $newBalance = $compte->solde - $pointsToDebit;

            if ($newBalance < 0) {
                throw new RuleViolationException('solde-negatif', 'Le solde ne peut pas devenir négatif.');
            }

            MouvementPoints::query()->create([
                'compte_id' => $compte->id,
                'type' => 'DEBIT_RETRAIT',
                'montant' => -$pointsToDebit,
                'solde_apres' => $newBalance,
                'libelle' => "{$articleName}, bon {$acquisition->reference}",
                'effectue_le' => $at,
                'acquisition_id' => $acquisition->id,
            ]);

            $compte->update([
                'solde' => $newBalance,
                'dernier_mouvement_le' => $at,
            ]);

            return $newBalance;
        });
    }
}

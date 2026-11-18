<?php

namespace App\Services\Paiements;

use App\Models\Acquisition;
use App\Models\Paiement;

class EspecesPasserelle implements PasserellePaiement
{
    public function initier(Acquisition $acquisition, int $montantFcfa, ?string $telephone, string $at, ?string $forcedRef = null): Paiement
    {
        return Paiement::query()->create([
            'acquisition_id' => $acquisition->id,
            'moyen' => 'ESPECES',
            'montant_fcfa' => max(1, $montantFcfa),
            'commission_fcfa' => 0,
            'reference' => $forcedRef ?: ('ESP-' . $acquisition->reference),
            'telephone' => $telephone,
            'statut' => 'CONFIRME',
            'cree_le' => $at,
            'confirme_le' => $at,
        ]);
    }
}

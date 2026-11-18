<?php

namespace App\Services\Paiements;

use App\Models\Acquisition;
use App\Models\ConfigurationPlateforme;
use App\Models\Paiement;
use Illuminate\Support\Str;

class OrangeMoneyPasserelle implements PasserellePaiement
{
    public function initier(Acquisition $acquisition, int $montantFcfa, ?string $telephone, string $at, ?string $forcedRef = null): Paiement
    {
        $config = ConfigurationPlateforme::current();
        $commission = (int) round($montantFcfa * (float) $config->taux_commission);
        $ref = $forcedRef ?: 'T_' . Str::upper(Str::random(4)) . '••••';

        return Paiement::query()->create([
            'acquisition_id' => $acquisition->id,
            'moyen' => 'ORANGE_MONEY',
            'montant_fcfa' => max(1, $montantFcfa),
            'commission_fcfa' => $commission,
            'reference' => $ref,
            'telephone' => $telephone,
            'statut' => 'EN_ATTENTE',
            'cree_le' => $at,
        ]);
    }
}

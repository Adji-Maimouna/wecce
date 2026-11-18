<?php

namespace App\Services\Paiements;

use App\Models\Acquisition;
use App\Models\Paiement;

interface PasserellePaiement
{
    public function initier(Acquisition $acquisition, int $montantFcfa, ?string $telephone, string $at, ?string $forcedRef = null): Paiement;
}

<?php

namespace App\Console\Commands;

use App\Services\WecceQueries;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ControlerSoldesCommand extends Command
{
    protected $signature = 'wecce:controler-soldes';
    protected $description = 'Vérifie que chaque solde de compte_points correspond à la somme de mouvement_points';

    public function handle(WecceQueries $queries): int
    {
        $mismatches = $queries->balanceMismatches();
        if (count($mismatches) > 0) {
            Log::critical('Divergence de solde détectée par v_controle_soldes', ['mismatches' => $mismatches]);
            $this->error(count($mismatches) . ' écart(s) détecté(s) !');
            return self::FAILURE;
        }

        $this->info('Aucun écart de solde détecté.');
        return self::SUCCESS;
    }
}

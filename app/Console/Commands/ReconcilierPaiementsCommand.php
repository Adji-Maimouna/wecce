<?php

namespace App\Console\Commands;

use App\Models\Paiement;
use App\Services\WecceEngine;
use App\Support\WecceClock;
use Illuminate\Console\Command;

class ReconcilierPaiementsCommand extends Command
{
    protected $signature = 'wecce:reconcilier-paiements';
    protected $description = 'Rattrape les paiements mobiles restés en attente';

    public function handle(WecceEngine $engine): int
    {
        $pending = Paiement::query()->where('statut', 'EN_ATTENTE')->get();
        $count = 0;

        foreach ($pending as $p) {
            if ($p->reference) {
                $engine->confirmPayment($p->reference, WecceClock::now());
                $count++;
            }
        }

        $this->info("{$count} paiement(s) rapproché(s).");
        return self::SUCCESS;
    }
}

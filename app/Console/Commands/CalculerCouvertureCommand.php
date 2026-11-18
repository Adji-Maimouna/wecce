<?php

namespace App\Console\Commands;

use App\Services\WecceEngine;
use App\Support\WecceClock;
use Illuminate\Console\Command;

class CalculerCouvertureCommand extends Command
{
    protected $signature = 'wecce:calculer-couverture {--event= : Libellé facultatif}';
    protected $description = 'Enregistre une mesure quotidienne dans snapshot_couverture';

    public function handle(WecceEngine $engine): int
    {
        $snap = $engine->snapshot(WecceClock::now(), $this->option('event'));
        $this->info("Snapshot enregistré : ratio {$snap->taux_couverture} ({$snap->niveau}).");
        return self::SUCCESS;
    }
}

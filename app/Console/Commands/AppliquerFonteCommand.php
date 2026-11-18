<?php

namespace App\Console\Commands;

use App\Services\WecceEngine;
use App\Support\WecceClock;
use Illuminate\Console\Command;
use Illuminate\Contracts\Console\Isolatable;

class AppliquerFonteCommand extends Command implements Isolatable
{
    protected $signature = 'wecce:fonte {--at= : Horodatage ISO facultatif}';
    protected $description = 'Applique la baisse mensuelle de 5 % sur les comptes de points et les prix affichés';

    public function handle(WecceEngine $engine): int
    {
        $at = (string) ($this->option('at') ?: WecceClock::now());
        $res = $engine->monthlyFonte($at);

        $this->info("Fonte mensuelle appliquée : {$res['accounts']} comptes et {$res['articles']} annonces.");
        return self::SUCCESS;
    }
}

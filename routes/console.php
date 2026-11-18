<?php

use Illuminate\Support\Facades\Schedule;

Schedule::command('wecce:fonte')->monthlyOn(1, '02:00')->withoutOverlapping();
Schedule::command('wecce:controler-soldes')->dailyAt('03:00');
Schedule::command('wecce:calculer-couverture')->dailyAt('06:00');
Schedule::command('wecce:reconcilier-paiements')->everyTenMinutes();

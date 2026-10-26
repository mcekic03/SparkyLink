<?php

use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Zakazani zadaci (kontejner `sparky-schedule` izvrsava `php artisan schedule:work`)
|--------------------------------------------------------------------------
*/

// Srednji kurs NBS se objavljuje oko 8h; drugi pokusaj za slucaj da servis kasni.
Schedule::command('exchange-rates:fetch')->dailyAt('08:30')->timezone('Europe/Belgrade');
Schedule::command('exchange-rates:fetch')->dailyAt('12:30')->timezone('Europe/Belgrade');

// Fiskalni racuni sacuvani dok sajt Poreske uprave nije odgovarao.
Schedule::command('receipts:retry')->hourly()->withoutOverlapping();

Schedule::command('sanctum:prune-expired --hours=24')->daily();

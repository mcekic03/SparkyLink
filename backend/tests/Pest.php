<?php

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| Feature testovi koriste MySQL test bazu (sparkylink_test) uz RefreshDatabase,
| pa migracije (uloge, podesavanja, prvi nalog) prolaze pre svakog testa.
| Spoljni servisi (kurs, Poreska uprava, Gotenberg) su uvek lazirani.
|
*/

use App\Enums\Currency;
use App\Enums\ExchangeRateSource;
use App\Enums\Role;
use App\Models\ExchangeRate;
use App\Models\User;
use Illuminate\Support\Carbon;

uses(
    Tests\TestCase::class,
    Illuminate\Foundation\Testing\RefreshDatabase::class,
)->in('Feature');

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
*/

function superAdmin(): User
{
    return User::query()->where('email', config('app.admin_email'))->firstOrFail();
}

function plainAdmin(): User
{
    return User::factory()->create(['role_id' => Role::ADMIN]);
}

function worker(): User
{
    return User::factory()->create(['role_id' => Role::WORKER]);
}

/**
 * Kurs evra za dan, upisan unapred (da testovi ne zovu servis).
 */
function rateFor(string $day, string $rate = '117.0000'): ExchangeRate
{
    return ExchangeRate::query()->create([
        'currency' => Currency::EUR,
        'source' => ExchangeRateSource::API,
        'rate' => $rate,
        'effective_at' => Carbon::createFromFormat('!Y-m-d', $day),
    ]);
}

function belgradeToday(): string
{
    return now('Europe/Belgrade')->toDateString();
}

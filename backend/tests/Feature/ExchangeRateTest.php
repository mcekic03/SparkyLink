<?php

use App\Enums\ExchangeRateSource;
use App\Models\ExchangeRate;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;

test('the rate for a day is fetched once from the NBS service and then read from the database', function () {
    Http::fake(['kurs.resenje.org/*' => Http::response(['code' => 'EUR', 'exchange_middle' => 117.1234])]);
    Sanctum::actingAs(plainAdmin());

    $this->getJson('/api/admin/exchange-rates/2026-10-20')->assertOk()->assertJsonPath('data.rate', '117.1234');
    $this->getJson('/api/admin/exchange-rates/2026-10-20')->assertOk()->assertJsonPath('data.rate', '117.1234');

    Http::assertSentCount(1);
    expect(ExchangeRate::query()->count())->toBe(1);
});

test('when the service is down the last known rate (up to 10 days back) is used', function () {
    Http::fake(['kurs.resenje.org/*' => Http::response('', 500)]);
    rateFor('2026-10-15', '117.0500');
    Sanctum::actingAs(plainAdmin());

    $this->getJson('/api/admin/exchange-rates/2026-10-20')->assertOk()->assertJsonPath('data.rate', '117.0500');
});

test('without any rate the user is asked to type it in', function () {
    Http::fake(['kurs.resenje.org/*' => Http::response('', 500)]);
    Sanctum::actingAs(plainAdmin());

    $this->getJson('/api/admin/exchange-rates/2026-10-20')
         ->assertUnprocessable()
         ->assertJsonValidationErrors('exchange_rate');
});

test('a future day uses today\'s rate', function () {
    rateFor(belgradeToday(), '117.3000');
    Sanctum::actingAs(plainAdmin());

    $this->getJson('/api/admin/exchange-rates/' . now()->addDays(30)->toDateString())
         ->assertOk()
         ->assertJsonPath('data.rate', '117.3000');
});

test('a manual rate is saved and is not overwritten by the service', function () {
    Http::fake(['kurs.resenje.org/*' => Http::response(['exchange_middle' => 117.9999])]);
    Sanctum::actingAs(plainAdmin());

    $this->postJson('/api/admin/exchange-rates', ['effective_at' => '2026-10-21', 'rate' => '117,4000'])->assertOk();
    $this->artisan('exchange-rates:fetch', ['--date' => '2026-10-21'])->assertSuccessful();

    $rate = ExchangeRate::query()->sole();
    expect($rate->rate)->toBe('117.4000')
        ->and($rate->source)->toBe(ExchangeRateSource::MANUAL);
});

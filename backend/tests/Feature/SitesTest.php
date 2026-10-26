<?php

use App\Enums\Currency;
use App\Enums\PaymentStatus;
use App\Enums\SiteStatus;
use App\Models\Payment;
use App\Models\Site;
use App\Models\SiteItem;
use Laravel\Sanctum\Sanctum;

test('an admin creates an open site, which gets a start date', function () {
    Sanctum::actingAs(plainAdmin());

    $response = $this->postJson('/api/admin/sites', [
        'status' => SiteStatus::OPEN->value,
        'currency' => Currency::EUR->value,
        'name' => 'Stan Novi Sad',
        'investor_name' => 'Marko Marković',
        'investor_phone' => '+381641234567',
        'markup_percent' => '15,5',
    ])->assertOk();

    expect($response->json('data.status'))->toBe(SiteStatus::OPEN->value)
        ->and($response->json('data.started_at'))->toBe(belgradeToday())
        ->and($response->json('data.markup_percent'))->toBe('15.50');
});

test('an offer can be created and later opened and closed', function () {
    Sanctum::actingAs(plainAdmin());

    $id = $this->postJson('/api/admin/sites', [
        'status' => SiteStatus::OFFER->value,
        'currency' => Currency::RSD->value,
        'name' => 'Lokal centar',
    ])->assertOk()->json('data.id');

    expect(Site::query()->find($id)->started_at)->toBeNull();

    $this->putJson("/api/admin/sites/{$id}", [
        'status' => SiteStatus::CLOSED->value,
        'currency' => Currency::RSD->value,
        'name' => 'Lokal centar',
    ])->assertOk()->assertJsonPath('data.completed_at', belgradeToday());
});

test('the list filters by work status and payment status and searches the investor', function () {
    Sanctum::actingAs(plainAdmin());

    $unpaid = Site::factory()->create(['name' => 'Kuća A', 'investor_name' => 'Jovan Jovanović']);
    SiteItem::factory()->for($unpaid)->create();

    $partial = Site::factory()->create(['name' => 'Kuća B']);
    SiteItem::factory()->for($partial)->create();
    Payment::factory()->for($partial)->create(['amount' => '5.00', 'amount_eur' => '5.00', 'amount_rsd' => '585.00']);

    $paid = Site::factory()->create(['name' => 'Kuća C']);
    SiteItem::factory()->for($paid)->create();
    Payment::factory()->for($paid)->create(['amount' => '15.00', 'amount_eur' => '15.00', 'amount_rsd' => '1755.00']);

    Site::factory()->create(['name' => 'Ponuda D', 'status' => SiteStatus::OFFER]);

    $names = fn (array $query) => collect($this->getJson('/api/admin/sites?' . http_build_query($query))->assertOk()->json('data'))->pluck('name')->sort()->values()->all();

    expect($names(['payment_status' => PaymentStatus::UNPAID->value]))->toBe(['Kuća A'])
        ->and($names(['payment_status' => PaymentStatus::PARTIALLY_PAID->value]))->toBe(['Kuća B'])
        ->and($names(['payment_status' => PaymentStatus::PAID->value]))->toBe(['Kuća C'])
        ->and($names(['status' => SiteStatus::OFFER->value]))->toBe(['Ponuda D'])
        ->and($names(['search' => 'Jovanović']))->toBe(['Kuća A']);

    $row = collect($this->getJson('/api/admin/sites?search=Kuća B')->json('data'))->first();
    expect($row['financials']['balance']['amount'])->toBe('10.00')
        ->and($row['financials']['payment_status'])->toBe(PaymentStatus::PARTIALLY_PAID->value);
});

test('a deleted site disappears from the list but can be restored', function () {
    Sanctum::actingAs(plainAdmin());
    $site = Site::factory()->create();

    $this->deleteJson("/api/admin/sites/{$site->id}")->assertOk();
    expect($this->getJson('/api/admin/sites')->json('data'))->toBeEmpty()
        ->and($this->getJson('/api/admin/sites?trashed=1')->json('data.0.id'))->toBe($site->id);

    $this->postJson("/api/admin/sites/{$site->id}/restore")->assertOk();
    expect($this->getJson('/api/admin/sites')->json('data.0.id'))->toBe($site->id);
});

test('a worker sees sites without any money', function () {
    $site = Site::factory()->create(['markup_percent' => '30']);
    SiteItem::factory()->for($site)->create();
    Sanctum::actingAs(worker());

    $list = $this->getJson('/api/admin/sites')->assertOk()->json('data.0');
    $detail = $this->getJson("/api/admin/sites/{$site->id}")->assertOk()->json('data');

    expect($list)->not->toHaveKeys(['financials', 'markup_percent', 'effective_markup_percent'])
        ->and($detail)->not->toHaveKeys(['financials', 'markup_percent'])
        ->and($detail['name'])->toBe($site->name);

    $this->getJson("/api/admin/sites/{$site->id}/items")->assertNotFound();
    $this->getJson("/api/admin/sites/{$site->id}/summary")->assertNotFound();
});

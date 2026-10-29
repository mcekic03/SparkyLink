<?php

use App\Enums\Currency;
use App\Enums\ItemType;
use App\Models\Site;
use App\Models\SiteItem;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Sanctum::actingAs(superAdmin());
    rateFor('2026-10-20', '117.2000');
    $this->site = Site::factory()->create();
});

test('material in dinars is stored in both currencies with the rate of its day', function () {
    $item = $this->postJson("/api/admin/sites/{$this->site->id}/items", [
        'type' => ItemType::MATERIAL->value,
        'currency' => Currency::RSD->value,
        'name' => 'Utičnica Šuko',
        'unit' => 'kom',
        'quantity' => '12',
        'purchase_price' => '350,00',
        'sale_price' => '420',
        'occurred_at' => '2026-10-20',
    ])->assertOk()->json('data');

    expect($item['exchange_rate'])->toBe('117.2000')
        ->and($item['purchase_total_rsd'])->toBe('4200.00')
        ->and($item['purchase_total_eur'])->toBe('35.84')
        ->and($item['sale_total_rsd'])->toBe('5040.00')
        ->and($item['sale_total_eur'])->toBe('43.00')
        ->and($item['is_billable'])->toBeTrue();
});

test('a service in euros has no purchase price, quantity times price per piece', function () {
    $item = $this->postJson("/api/admin/sites/{$this->site->id}/items", [
        'type' => ItemType::SERVICE->value,
        'currency' => Currency::EUR->value,
        'name' => 'Ugradnja utičnice',
        'quantity' => '25',
        'purchase_price' => '99',
        'sale_price' => '8',
        'occurred_at' => '2026-10-20',
    ])->assertOk()->json('data');

    expect($item['purchase_total_eur'])->toBe('0.00')
        ->and($item['sale_total_eur'])->toBe('200.00')
        ->and($item['sale_total_rsd'])->toBe('23440.00');
});

test('other costs are not billed by default and a manual rate wins', function () {
    $item = $this->postJson("/api/admin/sites/{$this->site->id}/items", [
        'type' => ItemType::OTHER->value,
        'currency' => Currency::RSD->value,
        'name' => 'Gorivo',
        'quantity' => '1',
        'purchase_price' => '3000',
        'occurred_at' => '2026-10-20',
        'exchange_rate' => '120',
    ])->assertOk()->json('data');

    expect($item['is_billable'])->toBeFalse()
        ->and($item['purchase_total_eur'])->toBe('25.00');
});

test('editing an item recalculates the totals; deleting removes it', function () {
    $id = SiteItem::factory()->for($this->site)->create()->id;

    $this->putJson("/api/admin/items/{$id}", [
        'type' => ItemType::MATERIAL->value,
        'currency' => Currency::EUR->value,
        'name' => 'Kabl',
        'quantity' => '20',
        'purchase_price' => '1',
        'sale_price' => '2',
        'occurred_at' => '2026-10-20',
    ])->assertOk()->assertJsonPath('data.sale_total_eur', '40.00');

    $this->deleteJson("/api/admin/items/{$id}")->assertOk();
    expect(SiteItem::query()->count())->toBe(0);
});

test('an estimated purchase price follows the sale price until the real one is entered', function () {
    $id = SiteItem::factory()->for($this->site)->create(['is_purchase_estimated' => true])->id;
    $payload = [
        'type' => ItemType::MATERIAL->value,
        'currency' => Currency::RSD->value,
        'name' => 'Pgp 3x2.5',
        'unit' => 'm',
        'quantity' => '10',
        'occurred_at' => '2026-10-20',
    ];

    // Bez nabavne cene procena ostaje i prati novu cenu za investitora.
    $estimated = $this->putJson("/api/admin/items/{$id}", [...$payload, 'sale_price' => '180', 'is_purchase_estimated' => true])
                      ->assertOk()
                      ->json('data');

    expect($estimated['is_purchase_estimated'])->toBeTrue()
        ->and($estimated['purchase_price'])->toBe('180.00')
        ->and($estimated['purchase_total_rsd'])->toBe('1800.00');

    // Upisana prava nabavna cena vise nije procena.
    $entered = $this->putJson("/api/admin/items/{$id}", [...$payload, 'sale_price' => '180', 'purchase_price' => '150', 'is_purchase_estimated' => false])
                    ->assertOk()
                    ->json('data');

    expect($entered['is_purchase_estimated'])->toBeFalse()
        ->and($entered['purchase_total_rsd'])->toBe('1500.00')
        ->and($entered['sale_total_rsd'])->toBe('1800.00');
});

test('an estimated purchase price is never offered as an earlier price', function () {
    SiteItem::factory()->for($this->site)->create([
        'name' => 'Pgp 3x2.5', 'purchase_price' => '170.00', 'sale_price' => '170.00', 'is_purchase_estimated' => true,
    ]);

    $suggestion = $this->getJson('/api/admin/item-suggestions?search=pgp')->assertOk()->json('data.0');

    expect($suggestion['purchase_price'])->toBeNull()
        ->and($suggestion['sale_price'])->toBe('170.00');
});

test('the quantity must be positive and the day must be a real date', function () {
    $this->postJson("/api/admin/sites/{$this->site->id}/items", [
        'type' => ItemType::MATERIAL->value,
        'currency' => Currency::EUR->value,
        'name' => 'Kabl',
        'quantity' => '0',
        'occurred_at' => '20.10.2026',
    ])->assertUnprocessable()->assertJsonValidationErrors(['quantity', 'occurred_at']);
});

test('suggestions combine the price list and the latest prices from earlier items', function () {
    SiteItem::factory()->for($this->site)->create(['name' => 'Osigurač 16A', 'purchase_price' => '2.10']);
    SiteItem::factory()->for($this->site)->create(['name' => 'Osigurač 16A', 'purchase_price' => '2.40']);

    $this->postJson('/api/admin/price-list-items', [
        'type' => ItemType::SERVICE->value,
        'currency' => Currency::EUR->value,
        'name' => 'Osigurač - zamena',
        'unit' => 'kom',
        'sale_price' => '5',
    ])->assertOk();

    $suggestions = $this->getJson('/api/admin/item-suggestions?search=osigura')->assertOk()->json('data');

    expect(collect($suggestions)->pluck('name')->all())->toBe(['Osigurač - zamena', 'Osigurač 16A'])
        ->and($suggestions[1]['purchase_price'])->toBe('2.40');
});

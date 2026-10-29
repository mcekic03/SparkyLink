<?php

use App\Actions\SiteItem\Admin\SaveSiteItemAction;
use App\Classes\Utilities\Money;
use App\Enums\Currency;
use App\Enums\ItemType;
use App\Models\Site;
use App\Models\SiteItem;
use Laravel\Sanctum\Sanctum;

/**
 * Materijal u dinarima sa procenjenom nabavnom (kao posle uvoza iz Excel-a).
 */
function estimatedMaterial(Site $site, string $name, string $quantity, string $salePrice): SiteItem
{
    return SaveSiteItemAction::make()->handle($site, [
        'type' => ItemType::MATERIAL->value,
        'currency' => Currency::RSD->value,
        'name' => $name,
        'quantity' => $quantity,
        'sale_price' => $salePrice,
        'is_purchase_estimated' => true,
        'occurred_at' => '2026-10-20',
    ]);
}

beforeEach(function () {
    Sanctum::actingAs(superAdmin());
    rateFor('2026-10-20', '117.0000');
    $this->site = Site::factory()->create(['currency' => Currency::EUR]);
});

test('a percentage lowers the purchase price of every chosen item while the investor price stays', function () {
    $klema = estimatedMaterial($this->site, 'Rns klema 16', '2', '700');
    $kabl = estimatedMaterial($this->site, 'Pgp 3x2.5', '12.5', '170.50');

    $this->postJson("/api/admin/sites/{$this->site->id}/items/purchase-prices", [
        'item_ids' => [$klema->id, $kabl->id],
        'percent' => '10',
    ])->assertOk()->assertJsonPath('data.count', 2);

    $klema->refresh();
    $kabl->refresh();

    expect($klema->purchase_price)->toBe('630.00')
        ->and($klema->purchase_total_rsd)->toBe('1260.00')
        ->and($klema->sale_price)->toBe('700.00')
        ->and($kabl->purchase_price)->toBe('153.45')
        ->and($kabl->sale_total_rsd)->toBe('2131.25')
        ->and($klema->is_purchase_estimated || $kabl->is_purchase_estimated)->toBeFalse();
});

test('what was paid in total is spread over the chosen items in proportion, to the para', function () {
    $trakon = estimatedMaterial($this->site, 'Rns trakon 1/6', '1', '920');
    $klema = estimatedMaterial($this->site, 'Rns klema 16', '2', '700');
    $kabl = estimatedMaterial($this->site, 'Pgp 3x2.5', '200', '170');

    $this->postJson("/api/admin/sites/{$this->site->id}/items/purchase-prices", [
        'item_ids' => [$trakon->id, $klema->id, $kabl->id],
        'total' => '30.000,00',
        'currency' => Currency::RSD->value,
    ])->assertOk()->assertJsonPath('data.purchase.rsd', '30000.00');

    $items = SiteItem::query()->orderBy('id')->get();

    // Razliku od zaokruzivanja nosi stavka sa kolicinom 1.
    expect($items->pluck('purchase_price')->all())->toBe(['759.62', '578.19', '140.42'])
        ->and(Money::sum($items->pluck('purchase_total_rsd')))->toBe('30000.00')
        ->and(Money::sum($items->pluck('sale_total_rsd')))->toBe('36320.00');
});

test('a total in euros is spread in proportion too, to the cent although the prices are in dinars', function () {
    $ids = [
        estimatedMaterial($this->site, 'Rns trakon 1/6', '1', '920')->id,
        estimatedMaterial($this->site, 'Rns klema 16', '2', '700')->id,
        estimatedMaterial($this->site, 'Pgp 3x2.5', '200', '170')->id,
    ];

    $this->postJson("/api/admin/sites/{$this->site->id}/items/purchase-prices", [
        'item_ids' => $ids,
        // Bez ispravke posle preracuna zbir bi bio 240,27 €.
        'total' => '240,28',
        'currency' => Currency::EUR->value,
    ])->assertOk()->assertJsonPath('data.purchase.eur', '240.28');
});

test('only material and other costs of this site can get a purchase price, with a percent or a total', function () {
    $foreign = estimatedMaterial(Site::factory()->create(), 'Tudja stavka', '1', '100');
    $service = SaveSiteItemAction::make()->handle($this->site, [
        'type' => ItemType::SERVICE->value, 'currency' => Currency::RSD->value, 'name' => 'Ugradnja', 'quantity' => '1', 'sale_price' => '500', 'occurred_at' => '2026-10-20',
    ]);
    $url = "/api/admin/sites/{$this->site->id}/items/purchase-prices";

    $this->postJson($url, ['item_ids' => [$foreign->id], 'percent' => '10'])->assertUnprocessable()->assertJsonValidationErrors(['item_ids.0']);
    $this->postJson($url, ['item_ids' => [$service->id], 'percent' => '10'])->assertUnprocessable()->assertJsonValidationErrors(['item_ids']);
    $this->postJson($url, ['item_ids' => [$service->id]])->assertUnprocessable()->assertJsonValidationErrors(['percent', 'total']);
    $this->postJson($url, ['item_ids' => [$service->id], 'percent' => '150'])->assertUnprocessable()->assertJsonValidationErrors(['percent']);
});

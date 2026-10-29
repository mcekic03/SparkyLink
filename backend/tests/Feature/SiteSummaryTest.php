<?php

use App\Enums\Currency;
use App\Enums\ItemType;
use App\Enums\PaymentStatus;
use App\Models\Site;
use App\Models\SiteItem;
use Laravel\Sanctum\Sanctum;

test('profit, paid and the debt in the billing currency come out right', function () {
    Sanctum::actingAs(superAdmin());
    rateFor('2026-10-20', '117.0000');
    rateFor(belgradeToday(), '117.0000');
    $site = Site::factory()->create(['currency' => Currency::EUR]);

    // Materijal: platio 10 €, naplacuje 15 €. Usluga: 200 €. Gorivo (ne naplacuje se): 1170 din.
    SiteItem::factory()->for($site)->create();
    SiteItem::factory()->for($site)->create([
        'type' => ItemType::SERVICE, 'purchase_price' => '0', 'purchase_total_eur' => '0', 'purchase_total_rsd' => '0',
        'sale_total_eur' => '200.00', 'sale_total_rsd' => '23400.00',
    ]);
    SiteItem::factory()->for($site)->create([
        'type' => ItemType::OTHER, 'is_billable' => false, 'currency' => Currency::RSD,
        'purchase_total_rsd' => '1170.00', 'purchase_total_eur' => '10.00', 'sale_total_rsd' => '0', 'sale_total_eur' => '0',
    ]);

    // Rad: 2 radnika x 8 h x 500 din = 8000 din (68,38 €).
    $this->postJson("/api/admin/sites/{$site->id}/labor-entries", [
        'currency' => Currency::RSD->value, 'workers_count' => 2, 'hours' => '8', 'hourly_rate' => '500', 'worked_at' => '2026-10-20',
    ])->assertOk()->assertJsonPath('data.total_rsd', '8000.00')->assertJsonPath('data.total_eur', '68.38');

    // Avans 100 €.
    $this->postJson("/api/admin/sites/{$site->id}/payments", [
        'currency' => Currency::EUR->value, 'amount' => '100', 'paid_at' => '2026-10-20',
    ])->assertOk()->assertJsonPath('data.amount_rsd', '11700.00');

    $summary = $this->getJson("/api/admin/sites/{$site->id}/summary")->assertOk()->json('data');

    expect($summary['billed']['eur'])->toBe('215.00')
        ->and($summary['costs']['eur'])->toBe('88.38')
        ->and($summary['profit']['eur'])->toBe('126.62')
        ->and($summary['materials']['margin']['eur'])->toBe('5.00')
        ->and($summary['items']['purchase']['eur'])->toBe('20.00')
        ->and($summary['paid']['eur'])->toBe('100.00')
        ->and($summary['balance']['amount'])->toBe('115.00')
        ->and($summary['balance']['other_amount'])->toBe('13455.00')
        ->and($summary['payment_status'])->toBe(PaymentStatus::PARTIALLY_PAID->value)
        ->and($summary['labor']['person_hours'])->toBe('16.00');
});

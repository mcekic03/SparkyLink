<?php

use App\Enums\Currency;
use App\Enums\SiteStatus;
use App\Models\LaborEntry;
use App\Models\Payment;
use App\Models\Setting;
use App\Models\Site;
use App\Models\SiteItem;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

test('the dashboard sums the period and lists who owes money', function () {
    rateFor(belgradeToday(), '117.0000');
    Sanctum::actingAs(superAdmin());

    $site = Site::factory()->create(['name' => 'Kuća Petrović', 'currency' => Currency::EUR]);
    SiteItem::factory()->for($site)->create(['occurred_at' => '2026-03-10']);
    LaborEntry::factory()->for($site)->create(['worked_at' => '2026-03-11']);
    Payment::factory()->for($site)->create(['amount' => '5.00', 'amount_eur' => '5.00', 'amount_rsd' => '585.00', 'paid_at' => '2026-03-12']);
    SiteItem::factory()->for($site)->create(['occurred_at' => '2025-12-31']);

    // Ponuda koju investitor jos nije prihvatio nije ni naplata ni dug.
    $offer = Site::factory()->create(['status' => SiteStatus::OFFER]);
    SiteItem::factory()->for($offer)->create(['occurred_at' => '2026-03-10', 'sale_total_eur' => '999.00']);

    $data = $this->getJson('/api/admin/dashboard?from=2026-01-01&to=2026-12-31')->assertOk()->json('data');

    expect($data['totals']['billed']['eur'])->toBe('15.00')
        ->and($data['totals']['costs']['eur'])->toBe('78.38')
        ->and($data['totals']['profit']['eur'])->toBe('-63.38')
        ->and($data['totals']['paid']['eur'])->toBe('5.00')
        ->and($data['receivables']['eur'])->toBe('25.00')
        ->and($data['receivables']['rsd'])->toBe('2925.00')
        ->and($data['debtors'][0]['name'])->toBe('Kuća Petrović')
        ->and($data['monthly'])->toHaveCount(12)
        ->and($data['top_sites'][0]['site_id'])->toBe($site->id);
});

test('the owner updates company data and the logo; a worker only sees the company name', function () {
    Storage::fake('local');
    Sanctum::actingAs(superAdmin());

    $this->putJson('/api/admin/settings', [
        Setting::COMPANY_NAME => 'Cekić Elektrik',
        Setting::COMPANY_PHONE => '+381 64 111 2233',
        Setting::DEFAULT_CURRENCY => Currency::EUR->value,
        Setting::DEFAULT_MARKUP_PERCENT => '25',
        Setting::OFFER_NOTE => 'Napomena za ponudu',
    ])->assertOk()->assertJsonPath('data.company_phone', '+381 64 111 2233');

    $this->post('/api/admin/settings/logo', ['logo' => UploadedFile::fake()->image('logo.png', 400, 400)], ['Accept' => 'application/json'])->assertOk();
    expect(Setting::defaultMarkupPercent())->toBe('25')
        ->and(Setting::logoPath())->toContain('branding');

});

<?php

use App\Contracts\FiscalReceiptFetcher;
use App\Enums\Currency;
use App\Enums\ItemType;
use App\Enums\ReceiptStatus;
use App\Models\Receipt;
use App\Models\Site;
use App\Models\SiteItem;
use App\Services\FiscalReceipts\FetchedReceipt;
use App\Services\FiscalReceipts\ReceiptFetchException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

const RECEIPT_URL = 'https://suf.purs.gov.rs/v/?vl=A1RFU1QxMjM0NTY3ODk';

function fakeFetcher(bool $works = true): void
{
    app()->bind(FiscalReceiptFetcher::class, fn () => new class($works) implements FiscalReceiptFetcher {
        public int $calls = 0;

        public function __construct(private bool $works) {}

        public function fetch(string $url): FetchedReceipt
        {
            if (! $this->works) {
                throw new ReceiptFetchException('Sajt ne odgovara');
            }

            return new FetchedReceipt(
                storeName: 'ЕЛЕКТРО ЦЕНТАР ДОО',
                storeTin: '100000001',
                storeAddress: 'Булевар 1',
                storeCity: 'Нови Сад',
                storeLocation: 'Продавница 1',
                receiptNumber: 'ABCD1234-ABCD1234-100',
                receiptCounter: '90/100ПП',
                totalAmount: '4560.00',
                issuedAt: '2026-10-20 10:15:00',
                journal: "=========== ФИСКАЛНИ РАЧУН ===========\nКАБЛ ПП-Ј 3х2,5 (Ђ)\n...",
                items: [
                    ['name' => 'КАБЛ ПП-Ј 3х2,5', 'quantity' => '50', 'unit' => 'м', 'unit_price' => '60.00', 'total' => '3000.00'],
                    ['name' => 'ОСИГУРАЧ 16А', 'quantity' => '12', 'unit' => 'ком', 'unit_price' => '130.00', 'total' => '1560.00'],
                ],
            );
        }
    });
}

beforeEach(function () {
    Storage::fake('local');
    rateFor('2026-10-20', '117.0000');
    $this->site = Site::factory()->create(['markup_percent' => '20']);
});

test('a scanned receipt: preview in latin with marked-up prices, then the chosen items become material', function () {
    fakeFetcher();
    Sanctum::actingAs(superAdmin());

    $preview = $this->postJson("/api/admin/sites/{$this->site->id}/receipts/preview", ['qr_url' => RECEIPT_URL])
                    ->assertOk()->json('data');

    expect($preview['fetched'])->toBeTrue()
        ->and($preview['receipt']['items'][0]['name'])->toBe('KABL PP-J 3h2,5')
        ->and($preview['receipt']['items'][0]['purchase_price'])->toBe('60.00')
        ->and($preview['receipt']['items'][0]['sale_price'])->toBe('72.00');

    $items = $preview['receipt']['items'];
    $items[0]['sale_price'] = '75';

    $receipt = $this->postJson("/api/admin/sites/{$this->site->id}/receipts", [
        'qr_url' => RECEIPT_URL,
        'items' => [$items[0]],
    ])->assertOk()->assertJsonPath('data.status', ReceiptStatus::FETCHED->value)->json('data');

    $item = SiteItem::query()->sole();
    expect($item->receipt_id)->toBe($receipt['id'])
        ->and($item->type)->toBe(ItemType::MATERIAL)
        ->and($item->currency)->toBe(Currency::RSD)
        ->and($item->purchase_total_rsd)->toBe('3000.00')
        ->and($item->sale_total_rsd)->toBe('3750.00')
        ->and($item->occurred_at->format('Y-m-d'))->toBe('2026-10-20')
        ->and(Receipt::query()->sole()->journal)->toContain('ФИСКАЛНИ РАЧУН');
});

test('the same receipt cannot be imported twice', function () {
    fakeFetcher();
    Sanctum::actingAs(superAdmin());

    $this->postJson("/api/admin/sites/{$this->site->id}/receipts", ['qr_url' => RECEIPT_URL, 'items' => []])->assertOk();

    $this->postJson("/api/admin/sites/{$this->site->id}/receipts/preview", ['qr_url' => RECEIPT_URL])
         ->assertUnprocessable()
         ->assertJsonValidationErrors('qr_url');
});

test('only tax administration links are accepted', function () {
    fakeFetcher();
    Sanctum::actingAs(superAdmin());

    $this->postJson("/api/admin/sites/{$this->site->id}/receipts/preview", ['qr_url' => 'https://example.com/v/?vl=abc'])
         ->assertUnprocessable()
         ->assertJsonValidationErrors('qr_url');
});

test('when the tax site is down the receipt waits and is fetched later by the scheduler', function () {
    fakeFetcher(works: false);
    Sanctum::actingAs(superAdmin());

    $preview = $this->postJson("/api/admin/sites/{$this->site->id}/receipts/preview", ['qr_url' => RECEIPT_URL])->assertOk()->json('data');
    expect($preview['fetched'])->toBeFalse();

    $this->postJson("/api/admin/sites/{$this->site->id}/receipts", ['qr_url' => RECEIPT_URL])
         ->assertOk()->assertJsonPath('data.status', ReceiptStatus::PENDING->value);

    fakeFetcher();
    $this->artisan('receipts:retry')->assertSuccessful();

    $receipt = Receipt::query()->sole();
    expect($receipt->status)->toBe(ReceiptStatus::FETCHED)
        ->and($receipt->store_name)->toBe('ЕЛЕКТРО ЦЕНТАР ДОО');

    $this->postJson("/api/admin/receipts/{$receipt->id}/items", [
        'items' => [['type' => 1, 'name' => 'Osigurač 16A', 'unit' => 'kom', 'quantity' => '12', 'purchase_price' => '130', 'sale_price' => '156']],
    ])->assertOk();

    expect(SiteItem::query()->sole()->sale_total_rsd)->toBe('1872.00');
});

test('a receipt without a qr code is kept as a photo and its copy is a signed pdf', function () {
    Http::fake(['gotenberg.test/*' => Http::response('%PDF-1.7 lazni', 200)]);
    Sanctum::actingAs(superAdmin());

    $receipt = $this->post("/api/admin/sites/{$this->site->id}/receipts", [
        'photo' => UploadedFile::fake()->image('racun.jpg', 800, 1600),
        'note' => 'Bojler - garancija 2 godine',
    ], ['Accept' => 'application/json'])->assertOk()->assertJsonPath('data.status', ReceiptStatus::MANUAL->value)->json('data');

    $this->get($receipt['photo_url'])->assertOk();
    $this->get($receipt['copy_url'])->assertOk()->assertHeader('Content-Type', 'application/pdf');
});

test('deleting a receipt also removes the items imported from it, and search finds receipts by text', function () {
    fakeFetcher();
    Sanctum::actingAs(superAdmin());

    $this->postJson("/api/admin/sites/{$this->site->id}/receipts", [
        'qr_url' => RECEIPT_URL,
        'items' => [['type' => 1, 'name' => 'Kabl', 'unit' => 'm', 'quantity' => '50', 'purchase_price' => '60', 'sale_price' => '72']],
    ])->assertOk();

    expect($this->getJson('/api/admin/receipts?search=ЕЛЕКТРО')->assertOk()->json('data'))->toHaveCount(1)
        ->and($this->getJson('/api/admin/receipts?search=nepostojece')->json('data'))->toHaveCount(0);

    $this->deleteJson('/api/admin/receipts/' . Receipt::query()->sole()->id)->assertOk();
    expect(SiteItem::query()->count())->toBe(0);
});

<?php

use App\Enums\Currency;
use App\Models\ItemImport;
use App\Models\Site;
use App\Models\SiteItem;
use Laravel\Sanctum\Sanctum;

/**
 * Prvi uvoz jednog dokumenta prodavnice; vraca broj uvoza.
 *
 * @param array<int, array{0: string, 1: string, 2: string, 3: string}> $rows naziv, jedinica, kolicina, cena
 */
function firstImport(Site $site, array $rows, string $name = 'ponuda.xls'): int
{
    test()->postJson("/api/admin/sites/{$site->id}/items/import", [
        'occurred_at' => '2026-10-20',
        'files' => [['name' => $name, 'items' => array_map(fn (array $row) => ['name' => $row[0], 'unit' => $row[1], 'quantity' => $row[2], 'sale_price' => $row[3]], $rows)]],
    ])->assertOk();

    return ItemImport::query()->latest('id')->value('id');
}

beforeEach(function () {
    Sanctum::actingAs(plainAdmin());
    rateFor('2026-10-20', '117.0000');
    rateFor('2026-10-27', '117.0000');
    $this->site = Site::factory()->create(['currency' => Currency::EUR]);
});

test('a new version of an earlier document is recognised and compared item by item', function () {
    $import = firstImport($this->site, [['Rns klema 16', 'kom', '2', '700'], ['Pgp 3x2.5', 'm', '12.5', '170.50'], ['Dozna f60', 'kom', '30', '15']]);

    $file = $this->post("/api/admin/sites/{$this->site->id}/items/spreadsheets", [
        'files' => [storeSpreadsheetFile([['RNS KLEMA 16', 'kom', 2, 700], ['Pgp 3x2.5', 'm', 12.5, 180], ['Dozna f60', 'kom', 30, 15], ['Sks 4x16', 'm', 50, 220]])],
    ], ['Accept' => 'application/json'])->assertOk()->json('data.files.0');

    $candidate = $file['candidates'][0];

    expect($file['suggested_import_id'])->toBe($import)
        ->and([$candidate['same'], $candidate['changed'], $candidate['new'], $candidate['missing']])->toBe([2, 1, 1, 0])
        ->and(array_column($candidate['rows'], 'status'))->toBe(['same', 'changed', 'same', 'new'])
        ->and($candidate['rows'][1]['previous']['sale_price'])->toBe('170.50');
});

test('an unrelated document is not offered as a new version', function () {
    firstImport($this->site, [['Rns klema 16', 'kom', '2', '700'], ['Pgp 3x2.5', 'm', '12.5', '170.50'], ['Dozna f60', 'kom', '30', '15']]);

    $file = $this->post("/api/admin/sites/{$this->site->id}/items/spreadsheets", [
        'files' => [storeSpreadsheetFile([['Dozna f60', 'kom', 20, 15], ['Tabla 3/18', 'kom', 1, 4200], ['Sapa crevo f26', 'm', 15, 190]])],
    ], ['Accept' => 'application/json'])->assertOk()->json('data.files.0');

    expect($file['suggested_import_id'])->toBeNull()
        ->and($file['candidates'][0]['same'] + $file['candidates'][0]['changed'])->toBe(1);
});

test('importing it as the new version changes what changed, adds what is new and keeps the rest', function () {
    $import = firstImport($this->site, [['Rns klema 16', 'kom', '2', '700'], ['Pgp 3x2.5', 'm', '12.5', '170.50'], ['Dozna f60', 'kom', '30', '15']]);
    [$klema, $kabl, $dozna] = SiteItem::query()->orderBy('id')->get()->all();

    // Za klemu je nabavna vec upisana i mora da ostane.
    $this->putJson("/api/admin/items/{$klema->id}", [...$klema->toSaveData(), 'purchase_price' => '600', 'is_purchase_estimated' => false])->assertOk();

    $this->postJson("/api/admin/sites/{$this->site->id}/items/import", [
        'occurred_at' => '2026-10-27',
        'files' => [[
            'name' => 'ponuda izmenjena.xls',
            'merge_into' => $import,
            'items' => [
                ['name' => 'Rns klema 16', 'unit' => 'kom', 'quantity' => '3', 'sale_price' => '700'],
                ['name' => 'Pgp 3x2.5', 'unit' => 'm', 'quantity' => '12,5', 'sale_price' => '170,50'],
                ['name' => 'Sks 4x16', 'unit' => 'm', 'quantity' => '50', 'sale_price' => '220'],
            ],
        ]],
    ])->assertOk()->assertJsonPath('message', __('spreadsheet_items_merged', ['added' => 1, 'updated' => 1, 'unchanged' => 1]));

    $klema->refresh();
    $sks = SiteItem::query()->where('name', 'Sks 4x16')->firstOrFail();

    expect(SiteItem::query()->count())->toBe(4)
        ->and(ItemImport::query()->count())->toBe(1)
        ->and($klema->quantity)->toBe('3.000')
        ->and($klema->purchase_price)->toBe('600.00')
        ->and($klema->purchase_total_rsd)->toBe('1800.00')
        ->and($klema->sale_total_rsd)->toBe('2100.00')
        ->and($klema->occurred_at->format('Y-m-d'))->toBe('2026-10-20')
        ->and($kabl->fresh()->updated_at->equalTo($kabl->updated_at))->toBeTrue()
        ->and($dozna->fresh())->not->toBeNull()
        ->and($sks->item_import_id)->toBe($import)
        ->and($sks->is_purchase_estimated)->toBeTrue()
        ->and($sks->occurred_at->format('Y-m-d'))->toBe('2026-10-27');
});

test('an estimated purchase price follows the new price of a changed item', function () {
    $import = firstImport($this->site, [['Dozna f60', 'kom', '30', '15']]);

    $this->postJson("/api/admin/sites/{$this->site->id}/items/import", [
        'occurred_at' => '2026-10-27',
        'files' => [['name' => 'ponuda.xls', 'merge_into' => $import, 'items' => [['name' => 'Dozna f60', 'unit' => 'kom', 'quantity' => '30', 'sale_price' => '18']]]],
    ])->assertOk();

    $dozna = SiteItem::query()->firstOrFail();

    expect($dozna->sale_price)->toBe('18.00')
        ->and($dozna->purchase_price)->toBe('18.00')
        ->and($dozna->is_purchase_estimated)->toBeTrue();
});

test('the same name twice is paired in the order of the document', function () {
    $import = firstImport($this->site, [['Dozna f60', 'kom', '30', '15'], ['Dozna f60', 'kom', '10', '15']]);

    $candidate = $this->post("/api/admin/sites/{$this->site->id}/items/spreadsheets", [
        'files' => [storeSpreadsheetFile([['Dozna f60', 'kom', 30, 15], ['Dozna f60', 'kom', 12, 15]])],
    ], ['Accept' => 'application/json'])->assertOk()->json('data.files.0.candidates.0');

    expect($candidate['import_id'])->toBe($import)
        ->and(array_column($candidate['rows'], 'status'))->toBe(['same', 'changed'])
        ->and($candidate['rows'][1]['previous']['quantity'])->toBe('10.000');
});

test('a new version can only go into an import of the same site', function () {
    $foreign = firstImport(Site::factory()->create(), [['Dozna f60', 'kom', '30', '15']]);

    $this->postJson("/api/admin/sites/{$this->site->id}/items/import", [
        'occurred_at' => '2026-10-27',
        'files' => [['name' => 'ponuda.xls', 'merge_into' => $foreign, 'items' => [['name' => 'Dozna f60', 'quantity' => '30', 'sale_price' => '15']]]],
    ])->assertUnprocessable()->assertJsonValidationErrors(['files.0.merge_into']);
});

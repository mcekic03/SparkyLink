<?php

use App\Enums\Currency;
use App\Enums\ItemType;
use App\Models\ItemImport;
use App\Models\Site;
use App\Models\SiteItem;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;

beforeEach(function () {
    Sanctum::actingAs(plainAdmin());
    $this->site = Site::factory()->create(['currency' => Currency::EUR]);
});

test('only the item rows of the first sheet are read, without the total row and the notes', function (string $format, string $name) {
    $file = storeSpreadsheetFile([['Rns klema 16', 'kom', 2, 700], ['Pgp 3x2.5', 'm', 12.5, 170.5]], $format, $name);

    $files = $this->post("/api/admin/sites/{$this->site->id}/items/spreadsheets", ['files' => [$file]], ['Accept' => 'application/json'])
                  ->assertOk()
                  ->json('data.files');

    expect($files)->toHaveCount(1)
        ->and($files[0]['name'])->toBe($name)
        ->and($files[0]['error'])->toBeNull()
        ->and($files[0]['items'])->toBe([
            ['name' => 'Rns klema 16', 'unit' => 'kom', 'quantity' => '2', 'unit_price' => '700.00', 'total' => '1400.00'],
            ['name' => 'Pgp 3x2.5', 'unit' => 'm', 'quantity' => '12.5', 'unit_price' => '170.50', 'total' => '2131.25'],
        ]);
})->with([
    'stari Excel (.xls)' => ['Xls', 'ponuda.xls'],
    'novi Excel (.xlsx)' => ['Xlsx', 'ponuda.xlsx'],
]);

test('several files are read at once, each with its own items or its own error', function () {
    $book = new Spreadsheet();
    $book->getActiveSheet()->fromArray([['Spisak za magacin'], ['bez tabele sa cenama']]);
    $path = tempnam(sys_get_temp_dir(), 'excel');
    IOFactory::createWriter($book, 'Xlsx')->save($path);

    $files = $this->post("/api/admin/sites/{$this->site->id}/items/spreadsheets", [
        'files' => [
            storeSpreadsheetFile([['Dozna f60', 'kom', 30, 15]], 'Xls', 'prva.xls'),
            storeSpreadsheetFile([['Sks 4x16', 'm', 50, 220]], 'Xls', 'druga.xls'),
            new UploadedFile($path, 'spisak.xlsx', null, null, true),
            UploadedFile::fake()->createWithContent('pokvaren.xls', 'ovo nije Excel'),
        ],
    ], ['Accept' => 'application/json'])->assertOk()->json('data.files');

    expect(collect($files)->pluck('name')->all())->toBe(['prva.xls', 'druga.xls', 'spisak.xlsx', 'pokvaren.xls'])
        ->and($files[0]['items'][0]['total'])->toBe('450.00')
        ->and($files[1]['items'][0]['total'])->toBe('11000.00')
        ->and($files[2]['items'])->toBe([])
        ->and($files[2]['error'])->toBe(__('spreadsheet_no_items_table'))
        ->and($files[3]['error'])->toBe(__('spreadsheet_unreadable'));
});

test('a file that is not an Excel spreadsheet is refused', function () {
    $this->post("/api/admin/sites/{$this->site->id}/items/spreadsheets", [
        'files' => [UploadedFile::fake()->create('racun.pdf', 20, 'application/pdf')],
    ], ['Accept' => 'application/json'])->assertUnprocessable()->assertJsonValidationErrors(['files.0']);
});

test('imported items are material whose estimated purchase price equals the investor price, so they make no profit yet', function () {
    rateFor('2026-10-20', '117.0000');
    rateFor(belgradeToday(), '117.0000');

    $this->postJson("/api/admin/sites/{$this->site->id}/items/import", [
        'occurred_at' => '2026-10-20',
        'files' => [[
            'name' => 'ponuda.xls',
            'items' => [
                ['name' => 'Rns klema 16', 'unit' => 'kom', 'quantity' => '2', 'sale_price' => '700'],
                ['name' => 'Pgp 3x2.5', 'unit' => 'm', 'quantity' => '12,5', 'sale_price' => '170,50'],
            ],
        ]],
    ])->assertOk()->assertJsonPath('message', __('spreadsheet_items_imported', ['count' => 2]));

    $items = SiteItem::query()->orderBy('id')->get();

    expect($items)->toHaveCount(2)
        ->and($items->every(fn (SiteItem $item) => $item->type === ItemType::MATERIAL
            && $item->currency === Currency::RSD
            && $item->is_billable
            && $item->is_purchase_estimated
            && $item->purchase_price === $item->sale_price
            && $item->purchase_total_rsd === $item->sale_total_rsd
            && $item->exchange_rate === '117.0000'
            && $item->occurred_at->format('Y-m-d') === '2026-10-20'))->toBeTrue()
        ->and($items[1]->sale_price)->toBe('170.50')
        ->and($items[1]->sale_total_rsd)->toBe('2131.25')
        ->and($items[1]->sale_total_eur)->toBe('18.22');

    $summary = $this->getJson("/api/admin/sites/{$this->site->id}/summary")->assertOk()->json('data');

    expect($summary['materials']['margin']['rsd'])->toBe('0.00')
        ->and($summary['profit']['rsd'])->toBe('0.00');
});

test('several files imported at once are remembered as one import, so their items are chosen together', function () {
    rateFor('2026-10-20', '117.0000');

    $this->postJson("/api/admin/sites/{$this->site->id}/items/import", [
        'occurred_at' => '2026-10-20',
        'files' => [
            ['name' => 'prva.xls', 'items' => [['name' => 'Dozna f60', 'quantity' => '30', 'sale_price' => '15']]],
            ['name' => 'druga.xls', 'items' => [
                ['name' => 'Sks 4x16', 'unit' => 'm', 'quantity' => '50', 'sale_price' => '220'],
                ['name' => 'Stezaljka', 'quantity' => '4', 'sale_price' => '170'],
            ]],
        ],
    ])->assertOk()->assertJsonPath('message', __('spreadsheet_items_imported', ['count' => 3]));

    $items = collect($this->getJson("/api/admin/sites/{$this->site->id}/items")->assertOk()->json('data'))->sortBy('id')->values();

    expect(ItemImport::query()->pluck('file_name')->all())->toBe(['prva.xls, druga.xls'])
        ->and($items->pluck('item_import.file_name')->unique()->values()->all())->toBe(['prva.xls, druga.xls'])
        ->and($items->pluck('item_import_id')->unique())->toHaveCount(1);
});

test('the import needs a date and at least one valid item', function () {
    $this->postJson("/api/admin/sites/{$this->site->id}/items/import", [
        'files' => [['name' => 'ponuda.xls', 'items' => [['name' => '', 'quantity' => '0', 'sale_price' => '10']]]],
    ])->assertUnprocessable()->assertJsonValidationErrors(['occurred_at', 'files.0.items.0.name', 'files.0.items.0.quantity']);

    expect(SiteItem::query()->count())->toBe(0);
});

test('a worker can neither read nor import spreadsheets', function () {
    Sanctum::actingAs(worker());

    $this->post("/api/admin/sites/{$this->site->id}/items/spreadsheets", [
        'files' => [storeSpreadsheetFile([['Dozna f60', 'kom', 30, 15]])],
    ], ['Accept' => 'application/json'])->assertNotFound();

    $this->postJson("/api/admin/sites/{$this->site->id}/items/import", [
        'occurred_at' => '2026-10-20',
        'files' => [['name' => 'ponuda.xls', 'items' => [['name' => 'Dozna f60', 'quantity' => '30', 'sale_price' => '15']]]],
    ])->assertNotFound();
});

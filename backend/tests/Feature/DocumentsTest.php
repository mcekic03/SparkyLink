<?php

use App\Enums\Currency;
use App\Enums\DocumentType;
use App\Enums\ItemType;
use App\Models\Document;
use App\Models\Payment;
use App\Models\Site;
use App\Models\SiteItem;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Storage::fake('local');
    Http::fake(['gotenberg.test/*' => Http::response('%PDF-1.7 lazni', 200)]);
    rateFor('2026-10-26', '117.5000');
    Sanctum::actingAs(superAdmin());

    $this->site = Site::factory()->create(['currency' => Currency::EUR]);
    SiteItem::factory()->for($this->site)->create(['name' => 'Kabl', 'occurred_at' => '2026-10-20']);
    SiteItem::factory()->for($this->site)->create([
        'type' => ItemType::SERVICE, 'name' => 'Ugradnja utičnice', 'quantity' => '25.000', 'sale_price' => '8.00',
        'purchase_total_eur' => '0', 'purchase_total_rsd' => '0', 'sale_total_eur' => '200.00', 'sale_total_rsd' => '23400.00',
    ]);
    SiteItem::factory()->for($this->site)->create(['type' => ItemType::OTHER, 'name' => 'Gorivo', 'is_billable' => false]);
    Payment::factory()->for($this->site)->create(['amount' => '50.00', 'amount_eur' => '50.00', 'amount_rsd' => '5850.00']);
});

test('an offer lists only billable items, carries the material notice and has no payments', function () {
    $document = $this->postJson("/api/admin/sites/{$this->site->id}/documents", [
        'type' => DocumentType::OFFER->value,
        'issued_at' => '2026-10-26',
    ])->assertOk()->json('data');

    $snapshot = Document::query()->findOrFail($document['id'])->snapshot;

    expect($document['number'])->toBe('1/2026')
        ->and($document['total_amount'])->toBe('215.00')
        ->and($document['balance_amount'])->toBe('215.00')
        ->and($snapshot['title'])->toBe('PONUDA')
        ->and($snapshot['notice'])->toContain('mogu se razlikovati')
        ->and($snapshot['payments'])->toBe([])
        ->and(collect($snapshot['groups'])->pluck('label')->all())->toBe(['Radovi i usluge', 'Materijal'])
        ->and($snapshot['total_other'])->toBe('25262.50')
        ->and(json_encode($snapshot))->not->toContain('Gorivo')
        ->and(json_encode($snapshot))->not->toContain('purchase');

    Storage::disk('local')->assertExists(Document::query()->findOrFail($document['id'])->pdf_path);
});

test('a final invoice subtracts payments and numbers separately from offers', function () {
    $this->postJson("/api/admin/sites/{$this->site->id}/documents", ['type' => DocumentType::OFFER->value, 'issued_at' => '2026-10-26'])->assertOk();

    $invoice = $this->postJson("/api/admin/sites/{$this->site->id}/documents", [
        'type' => DocumentType::FINAL_INVOICE->value,
        'issued_at' => '2026-10-26',
        'is_itemized' => false,
    ])->assertOk()->json('data');

    $snapshot = Document::query()->findOrFail($invoice['id'])->snapshot;
    $material = collect($snapshot['groups'])->firstWhere('label', 'Materijal');

    expect($invoice['number'])->toBe('1/2026')
        ->and($invoice['paid_amount'])->toBe('50.00')
        ->and($invoice['balance_amount'])->toBe('165.00')
        ->and($snapshot['title'])->toBe('ZAVRŠNI RAČUN')
        ->and($snapshot['notice'])->toBeNull()
        ->and($material['lines'])->toHaveCount(1)
        ->and($material['lines'][0]['amount'])->toBe('15.00');
});

test('later item changes do not change an issued document', function () {
    $id = $this->postJson("/api/admin/sites/{$this->site->id}/documents", ['type' => DocumentType::OFFER->value, 'issued_at' => '2026-10-26'])
               ->assertOk()->json('data.id');

    SiteItem::query()->where('name', 'Kabl')->update(['sale_total_eur' => '999.00']);

    expect(Document::query()->findOrFail($id)->snapshot['total'])->toBe('215.00');
});

test('a site without billable items cannot get a document, and the pdf link is signed', function () {
    $empty = Site::factory()->create();
    // Fiksan dan (kao u ostalim testovima), da test ne zavisi od danasnjeg kursa.
    $this->postJson("/api/admin/sites/{$empty->id}/documents", ['type' => DocumentType::OFFER->value, 'issued_at' => '2026-10-26'])
         ->assertUnprocessable()->assertJsonValidationErrors('type');

    $document = $this->postJson("/api/admin/sites/{$this->site->id}/documents", ['type' => DocumentType::OFFER->value, 'issued_at' => '2026-10-26'])
                     ->assertOk()->json('data');

    $this->get($document['pdf_url'])->assertOk()->assertHeader('Content-Type', 'application/pdf');
    $this->get("/api/files/documents/{$document['id']}")->assertForbidden();
});

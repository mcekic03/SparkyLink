<?php

namespace App\Actions\Document\Admin;

use App\Actions\Document\Shared\RenderDocumentPdfAction;
use App\Actions\ExchangeRate\Shared\ResolveExchangeRateAction;
use App\Classes\Utilities\Money;
use App\Enums\Currency;
use App\Enums\DocumentType;
use App\Enums\ItemType;
use App\Models\Document;
use App\Models\Setting;
use App\Models\Site;
use App\Models\SiteItem;
use App\Traits\Core\AsAction;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class CreateDocumentAction
{
    use AsAction;

    // Redosled grupa na dokumentu: prvo rad, pa materijal, pa ostalo.
    private const GROUP_ORDER = [ItemType::SERVICE, ItemType::MATERIAL, ItemType::OTHER];

    public function __construct(
        private readonly ResolveExchangeRateAction $resolveExchangeRateAction,
        private readonly RenderDocumentPdfAction $renderDocumentPdfAction,
    ) {}

    /**
     * Pravi ponudu ili zavrsni racun: snimak naplativih stavki (i uplata za zavrsni racun)
     * u valuti obracuna gradilista, druga valuta po kursu na dan dokumenta, pa PDF.
     *
     * @param array<string, mixed> $data validirani podaci (StoreDocumentRequest)
     *
     * @throws ValidationException
     */
    public function handle(Site $site, array $data): Document
    {
        $type = DocumentType::from((int) $data['type']);
        $issuedAt = (string) ($data['issued_at'] ?? now('Europe/Belgrade')->toDateString());
        $isItemized = (bool) ($data['is_itemized'] ?? true);
        $currency = $site->currency;
        $other = $currency->other();
        $rate = $this->resolveExchangeRateAction->handle($issuedAt);

        $items = $site->items()->where('is_billable', true)->orderBy('occurred_at')->orderBy('id')->get();

        if ($items->isEmpty()) {
            throw ValidationException::withMessages(['type' => __('document_nothing_to_bill')]);
        }

        $groups = $this->groups($items, $currency, $rate, $isItemized);
        $total = Money::sum(array_column($groups, 'subtotal'));

        $payments = [];
        $paid = '0.00';

        if ($type === DocumentType::FINAL_INVOICE) {
            $payments = $site->payments()->orderBy('paid_at')->orderBy('id')->get()
                             ->map(fn ($payment) => [
                                 'paid_at' => $payment->paid_at->format('Y-m-d'),
                                 'note' => $payment->note,
                                 'amount' => $payment->{'amount_' . $currency->column()},
                             ])->all();
            $paid = Money::sum(array_column($payments, 'amount'));
        }

        $balance = Money::subtract($total, $paid);
        $note = $data['note'] ?? null;

        return DB::transaction(function () use ($site, $type, $issuedAt, $isItemized, $currency, $other, $rate, $groups, $total, $payments, $paid, $balance, $note) {
            $year = (int) substr($issuedAt, 0, 4);
            $sequence = (int) Document::query()->where('type', $type)->where('year', $year)->lockForUpdate()->max('sequence') + 1;
            $number = "{$sequence}/{$year}";

            $snapshot = [
                'title' => $type->title(),
                'number' => $number,
                'issued_at' => $issuedAt,
                'currency' => $currency->code(),
                'currency_symbol' => $currency->symbol(),
                'other_currency' => $other->code(),
                'other_currency_symbol' => $other->symbol(),
                'exchange_rate' => $rate,
                'company' => Setting::company(),
                'site' => ['name' => $site->name, 'address' => $site->address, 'city' => $site->city],
                'investor' => [
                    'name' => $site->investor_name,
                    'phone' => $site->investor_phone,
                    'email' => $site->investor_email,
                    'address' => $site->investor_address,
                ],
                'groups' => $groups,
                'total' => $total,
                'total_other' => Money::convert($total, $currency, $other, $rate),
                'payments' => $payments,
                'paid' => $paid,
                'balance' => $balance,
                'balance_other' => Money::convert($balance, $currency, $other, $rate),
                // Ponuda nosi krupnu napomenu o materijalu; zavrsni racun svoju napomenu iz podesavanja.
                'notice' => $type === DocumentType::OFFER ? (string) Setting::getValue(Setting::OFFER_NOTE) : null,
                'footer_note' => $type === DocumentType::FINAL_INVOICE ? (string) Setting::getValue(Setting::INVOICE_NOTE, '') : null,
                'note' => $note,
            ];

            $document = Document::query()->create([
                'site_id' => $site->id,
                'created_by' => auth()->id(),
                'type' => $type,
                'currency' => $currency,
                'number' => $number,
                'year' => $year,
                'sequence' => $sequence,
                'exchange_rate' => $rate,
                'total_amount' => $total,
                'paid_amount' => $paid,
                'balance_amount' => $balance,
                'snapshot' => $snapshot,
                'note' => $note,
                'is_itemized' => $isItemized,
                'issued_at' => $issuedAt,
            ]);

            $path = "documents/{$site->id}/" . strtolower($type->name) . "-{$sequence}-{$year}.pdf";
            Storage::disk('local')->put($path, $this->renderDocumentPdfAction->handle($document));
            $document->update(['pdf_path' => $path]);

            return $document;
        });
    }

    /**
     * Grupe (rad, materijal, ostalo) sa redovima u valuti obracuna; kad nije po stavkama,
     * materijal je jedan zbirni red.
     *
     * @param Collection<int, SiteItem> $items
     *
     * @return array<int, array<string, mixed>>
     */
    private function groups(Collection $items, Currency $currency, string $rate, bool $isItemized): array
    {
        $other = $currency->other();
        $groups = [];

        foreach (self::GROUP_ORDER as $type) {
            $typeItems = $items->filter(fn (SiteItem $item) => $item->type === $type)->values();

            if ($typeItems->isEmpty()) {
                continue;
            }

            $lines = $typeItems->map(function (SiteItem $item) use ($currency, $other, $rate) {
                $amount = (string) $item->{'sale_total_' . $currency->column()};

                return [
                    'name' => $item->name,
                    'unit' => $item->unit,
                    'quantity' => $item->quantity,
                    'unit_price' => Money::convert($item->sale_price, $item->currency, $currency, $item->exchange_rate),
                    'amount' => $amount,
                    'amount_other' => Money::convert($amount, $currency, $other, $rate),
                ];
            })->all();

            $subtotal = Money::sum(array_column($lines, 'amount'));

            if ($type === ItemType::MATERIAL && ! $isItemized) {
                $lines = [[
                    'name' => 'Materijal (zbirno)',
                    'unit' => 'paušal',
                    'quantity' => '1.000',
                    'unit_price' => $subtotal,
                    'amount' => $subtotal,
                    'amount_other' => Money::convert($subtotal, $currency, $other, $rate),
                ]];
            }

            $groups[] = [
                'type' => $type->value,
                'label' => match ($type) {
                    ItemType::SERVICE => 'Radovi i usluge',
                    ItemType::MATERIAL => 'Materijal',
                    ItemType::OTHER => 'Ostalo',
                },
                'lines' => $lines,
                'subtotal' => $subtotal,
                'subtotal_other' => Money::convert($subtotal, $currency, $other, $rate),
            ];
        }

        return $groups;
    }
}

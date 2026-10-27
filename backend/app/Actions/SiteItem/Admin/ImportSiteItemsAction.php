<?php

namespace App\Actions\SiteItem\Admin;

use App\Actions\ExchangeRate\Shared\ResolveExchangeRateAction;
use App\Classes\Utilities\ImportedItemsMatcher;
use App\Enums\Currency;
use App\Enums\ItemType;
use App\Models\ItemImport;
use App\Models\Site;
use App\Models\SiteItem;
use App\Traits\Core\AsAction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ImportSiteItemsAction
{
    use AsAction;

    public function __construct(
        private readonly ResolveExchangeRateAction $resolveExchangeRateAction,
        private readonly SaveSiteItemAction $saveSiteItemAction,
    ) {}

    /**
     * Stavke iz Excel fajlova prodavnice postaju materijal gradilista: cena iz fajla je cena za
     * investitora, a nabavna je procena jednaka njoj (bez zarade) dok korisnik ne upise pravu.
     *
     * Fajl koji je nova verzija ranijeg uvoza (`merge_into`) se poredi sa njim: iste stavke se
     * preskacu, izmenjenim se menja kolicina, jedinica i cena (datum i kurs ostaju), nove se dodaju
     * u taj uvoz; stavke kojih vise nema ostaju. Ostali fajlovi poslati odjednom su jedan nov uvoz.
     * Cene su u dinarima, po kursu dana stavki; sve se upisuje zajedno ili nista.
     *
     * @param array<int, array{name: string, merge_into?: int|null, items: array<int, array<string, mixed>>}> $files
     *
     * @return array{added: int, updated: int, unchanged: int}
     *
     * @throws ValidationException
     */
    public function handle(Site $site, string $day, array $files): array
    {
        $rate = $this->resolveExchangeRateAction->handle($day);

        return DB::transaction(function () use ($site, $day, $files, $rate) {
            $counts = ['added' => 0, 'updated' => 0, 'unchanged' => 0];
            $fresh = array_values(array_filter($files, fn (array $file) => empty($file['merge_into'])));
            $newImport = $fresh === [] ? null : ItemImport::query()->create([
                'site_id' => $site->id,
                'created_by' => auth()->id(),
                'file_name' => Str::limit(implode(', ', array_column($fresh, 'name')), 250),
            ]);

            foreach ($files as $file) {
                if (empty($file['merge_into'])) {
                    foreach ($file['items'] as $item) {
                        $this->addItem($site, $newImport, $item, $day, $rate);
                        $counts['added']++;
                    }

                    continue;
                }

                $import = ItemImport::query()
                                    ->where('site_id', $site->id)
                                    ->with(['items' => fn ($query) => $query->orderBy('id')])
                                    ->findOrFail($file['merge_into']);

                $match = ImportedItemsMatcher::match($import->items, array_map(fn (array $item) => [
                    'name' => $item['name'],
                    'unit' => $item['unit'] ?? null,
                    'quantity' => $item['quantity'],
                    'price' => $item['sale_price'],
                ], $file['items']));

                foreach ($match['rows'] as $index => $result) {
                    $item = $file['items'][$index];

                    if ($result['status'] === ImportedItemsMatcher::SAME) {
                        $counts['unchanged']++;
                    } elseif ($result['status'] === ImportedItemsMatcher::CHANGED) {
                        $this->updateItem($site, $result['item'], $item);
                        $counts['updated']++;
                    } else {
                        $this->addItem($site, $import, $item, $day, $rate);
                        $counts['added']++;
                    }
                }

                $import->touch();
            }

            return $counts;
        });
    }

    /**
     * @param array<string, mixed> $item
     */
    private function addItem(Site $site, ItemImport $import, array $item, string $day, string $rate): void
    {
        $this->saveSiteItemAction->handle($site, [
            'item_import_id' => $import->id,
            'type' => ItemType::MATERIAL->value,
            'currency' => Currency::RSD->value,
            'name' => $item['name'],
            'unit' => $item['unit'] ?? 'kom',
            'quantity' => $item['quantity'],
            'is_purchase_estimated' => true,
            'sale_price' => $item['sale_price'],
            'is_billable' => true,
            'occurred_at' => $day,
            'exchange_rate' => $rate,
        ]);
    }

    /**
     * Nova kolicina, jedinica i cena; upisana nabavna cena ostaje, a procena prati novu cenu.
     *
     * @param array<string, mixed> $item
     */
    private function updateItem(Site $site, SiteItem $existing, array $item): void
    {
        $this->saveSiteItemAction->handle($site, [
            ...$existing->toSaveData(),
            'name' => $item['name'],
            'unit' => $item['unit'] ?? $existing->unit,
            'quantity' => $item['quantity'],
            'sale_price' => $item['sale_price'],
        ], $existing);
    }
}

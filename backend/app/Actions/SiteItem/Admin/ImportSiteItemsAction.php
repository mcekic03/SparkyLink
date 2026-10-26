<?php

namespace App\Actions\SiteItem\Admin;

use App\Actions\ExchangeRate\Shared\ResolveExchangeRateAction;
use App\Enums\Currency;
use App\Enums\ItemType;
use App\Models\ItemImport;
use App\Models\Site;
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
     * Sve sto je ubaceno odjednom (i vise fajlova) pamti se kao jedan uvoz, da bi se te stavke
     * birale zajedno. Cene su u dinarima, po kursu dana stavki; sve se upisuje zajedno ili nista.
     *
     * @param array<int, array{name: string, items: array<int, array<string, mixed>>}> $files
     *
     * @throws ValidationException
     */
    public function handle(Site $site, string $day, array $files): int
    {
        $rate = $this->resolveExchangeRateAction->handle($day);

        return DB::transaction(function () use ($site, $day, $files, $rate) {
            $count = 0;
            $import = ItemImport::query()->create([
                'site_id' => $site->id,
                'created_by' => auth()->id(),
                'file_name' => Str::limit(implode(', ', array_column($files, 'name')), 250),
            ]);

            foreach ($files as $file) {
                foreach ($file['items'] as $item) {
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
                    $count++;
                }
            }

            return $count;
        });
    }
}

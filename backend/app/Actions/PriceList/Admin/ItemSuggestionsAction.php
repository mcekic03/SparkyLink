<?php

namespace App\Actions\PriceList\Admin;

use App\Enums\ItemType;
use App\Models\PriceListItem;
use App\Models\SiteItem;
use App\Traits\Core\AsAction;

class ItemSuggestionsAction
{
    use AsAction;

    private const LIMIT = 8;

    /**
     * Predlozi pri unosu stavke: cenovnik + ranije unete stavke sa poslednjim cenama.
     *
     * @return array<int, array<string, mixed>>
     */
    public function handle(string $search, ?ItemType $type = null): array
    {
        $search = trim($search);

        if (mb_strlen($search) < 2) {
            return [];
        }

        $priceList = PriceListItem::query()
                                  ->where('is_active', true)
                                  ->where('name', 'like', "%{$search}%")
                                  ->when($type, fn ($query) => $query->where('type', $type))
                                  ->orderBy('name')
                                  ->limit(self::LIMIT)
                                  ->get()
                                  ->map(fn (PriceListItem $item) => [
                                      'source' => 'price_list',
                                      'type' => $item->type->value,
                                      'name' => $item->name,
                                      'unit' => $item->unit,
                                      'currency' => $item->currency->value,
                                      'purchase_price' => $item->purchase_price,
                                      'sale_price' => $item->sale_price,
                                  ]);

        // Poslednja stavka za svaki naziv (najnovije cene).
        $latestIds = SiteItem::query()
                             ->selectRaw('MAX(id) AS id')
                             ->where('name', 'like', "%{$search}%")
                             ->when($type, fn ($query) => $query->where('type', $type))
                             ->groupBy('name')
                             ->orderByRaw('MAX(id) DESC')
                             ->limit(self::LIMIT)
                             ->pluck('id');

        $history = SiteItem::query()
                           ->whereIn('id', $latestIds)
                           ->orderByDesc('id')
                           ->get()
                           ->map(fn (SiteItem $item) => [
                               'source' => 'history',
                               'type' => $item->type->value,
                               'name' => $item->name,
                               'unit' => $item->unit,
                               'currency' => $item->currency->value,
                               // Procena nije cena koju je korisnik platio.
                               'purchase_price' => $item->is_purchase_estimated ? null : $item->purchase_price,
                               'sale_price' => $item->sale_price,
                           ]);

        $seen = $priceList->pluck('name')->map(fn (string $name) => mb_strtolower($name))->all();

        return $priceList
            ->concat($history->reject(fn (array $item) => in_array(mb_strtolower($item['name']), $seen, true)))
            ->values()
            ->all();
    }
}

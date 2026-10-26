<?php

namespace App\Actions\SiteItem\Admin;

use App\Classes\Utilities\Money;
use App\Enums\Currency;
use App\Models\Site;
use App\Models\SiteItem;
use App\Traits\Core\AsAction;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SetPurchasePricesAction
{
    use AsAction;

    public function __construct(
        private readonly SaveSiteItemAction $saveSiteItemAction,
    ) {}

    /**
     * Nabavna cena za vise stavki odjednom, srazmerno ceni za investitora (koja se ne menja):
     * manja za procenat, ili takva da zbir nabavnog bude koliko je korisnik platio. Usluge
     * nemaju nabavnu cenu, pa se preskacu. Kurs i datum stavki ostaju isti.
     *
     * @param array<int, int> $itemIds
     *
     * @return array{count: int, purchase: array{rsd: string, eur: string}, sale: array{rsd: string, eur: string}}
     *
     * @throws ValidationException
     */
    public function handle(Site $site, array $itemIds, ?string $percent, ?string $total, ?Currency $currency): array
    {
        $items = $site->items()
                      ->whereIn('id', $itemIds)
                      ->orderBy('id')
                      ->get()
                      ->filter(fn (SiteItem $item) => $item->type->hasPurchasePrice())
                      ->values();

        if ($items->isEmpty()) {
            throw ValidationException::withMessages(['item_ids' => __('purchase_prices_no_items')]);
        }

        $prices = $total !== null && $currency !== null
            ? $this->pricesForTotal($items, BigDecimal::of(Money::normalize($total)), $currency)
            : $this->scaled($items, BigDecimal::one()->minus(BigDecimal::of(Money::normalize($percent))->dividedBy(100, 6, RoundingMode::HALF_UP)));

        DB::transaction(function () use ($site, $items, $prices) {
            foreach ($items as $item) {
                $this->saveSiteItemAction->handle($site, [
                    ...$item->toSaveData(),
                    'purchase_price' => (string) $prices[$item->id],
                    'is_purchase_estimated' => false,
                ], $item);
            }
        });

        $saved = $site->items()->whereIn('id', $items->pluck('id'))->get();

        return [
            'count' => $saved->count(),
            'purchase' => ['rsd' => Money::sum($saved->pluck('purchase_total_rsd')), 'eur' => Money::sum($saved->pluck('purchase_total_eur'))],
            'sale' => ['rsd' => Money::sum($saved->pluck('sale_total_rsd')), 'eur' => Money::sum($saved->pluck('sale_total_eur'))],
        ];
    }

    /**
     * Isti procenat za sve stavke, takav da zbir bude placeni iznos, tacno na paru u valuti u
     * kojoj je upisan. Razliku od zaokruzivanja (i od preracuna u drugu valutu) nosi stavka sa
     * najmanjom kolicinom; sa kolicinom 1 pogadja se tacno.
     *
     * @param Collection<int, SiteItem> $items
     *
     * @return array<int, BigDecimal>
     *
     * @throws ValidationException
     */
    private function pricesForTotal(Collection $items, BigDecimal $total, Currency $currency): array
    {
        $sale = BigDecimal::of(Money::sum($items->pluck('sale_total_' . $currency->column())));

        if (! $sale->isPositive()) {
            throw ValidationException::withMessages(['total' => __('purchase_prices_no_sale')]);
        }

        $prices = $this->scaled($items, $total->dividedBy($sale, 10, RoundingMode::HALF_UP));

        /** @var SiteItem $carrier */
        $carrier = $items->sort(fn (SiteItem $a, SiteItem $b) => BigDecimal::of($a->quantity)->compareTo($b->quantity))->first();

        // Posle preracuna razlika moze da ostane jos za paru, pa se ispravka ponavlja.
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $sum = BigDecimal::of(Money::sum($items->map(fn (SiteItem $item) => $this->lineTotalIn($item, $prices[$item->id], $currency))));
            $difference = $total->minus($sum);

            if ($difference->isZero()) {
                break;
            }

            $inItemCurrency = BigDecimal::of(Money::convert((string) $difference, $currency, $carrier->currency, $carrier->exchange_rate));
            $adjusted = $prices[$carrier->id]->plus($inItemCurrency->dividedBy($carrier->quantity, Money::SCALE, RoundingMode::HALF_UP));

            if ($adjusted->isNegative() || $adjusted->isEqualTo($prices[$carrier->id])) {
                break;
            }

            $prices[$carrier->id] = $adjusted;
        }

        return $prices;
    }

    /**
     * Ukupno za stavku sa datom cenom, u trazenoj valuti (po kursu stavke, kao pri cuvanju).
     */
    private function lineTotalIn(SiteItem $item, BigDecimal $price, Currency $currency): string
    {
        return Money::toBoth(Money::lineTotal($item->quantity, (string) $price), $item->currency, $item->exchange_rate)[$currency->column()];
    }

    /**
     * @param Collection<int, SiteItem> $items
     *
     * @return array<int, BigDecimal>
     */
    private function scaled(Collection $items, BigDecimal $factor): array
    {
        return $items->mapWithKeys(fn (SiteItem $item) => [
            $item->id => BigDecimal::of($item->sale_price)->multipliedBy($factor)->toScale(Money::SCALE, RoundingMode::HALF_UP),
        ])->all();
    }
}

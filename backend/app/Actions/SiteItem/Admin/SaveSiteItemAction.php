<?php

namespace App\Actions\SiteItem\Admin;

use App\Actions\ExchangeRate\Shared\ResolveExchangeRateAction;
use App\Classes\Utilities\Money;
use App\Enums\Currency;
use App\Enums\ItemType;
use App\Models\Site;
use App\Models\SiteItem;
use App\Traits\Core\AsAction;

class SaveSiteItemAction
{
    use AsAction;

    public function __construct(
        private readonly ResolveExchangeRateAction $resolveExchangeRateAction,
    ) {}

    /**
     * Cuva stavku i racuna oba iznosa (RSD i EUR) po kursu na dan stavke.
     *
     * @param array<string, mixed> $data validirani podaci (SiteItemRequest)
     */
    public function handle(Site $site, array $data, ?SiteItem $item = null): SiteItem
    {
        $type = ItemType::from((int) $data['type']);
        $currency = Currency::from((int) $data['currency']);
        $day = (string) ($data['occurred_at'] ?? now('Europe/Belgrade')->toDateString());
        $rate = isset($data['exchange_rate']) && $data['exchange_rate'] !== null
            ? (string) $data['exchange_rate']
            : $this->resolveExchangeRateAction->handle($day);

        $quantity = (string) $data['quantity'];
        $salePrice = (string) ($data['sale_price'] ?? 0);
        $estimated = $type->hasPurchasePrice() && (bool) ($data['is_purchase_estimated'] ?? false);

        // Procenjena nabavna prati cenu za investitora, pa stavka ne pravi zaradu dok se ne upise prava.
        $purchasePrice = match (true) {
            ! $type->hasPurchasePrice() => '0',
            $estimated => $salePrice,
            default => (string) ($data['purchase_price'] ?? 0),
        };

        $purchase = Money::toBoth(Money::lineTotal($quantity, $purchasePrice), $currency, $rate);
        $sale = Money::toBoth(Money::lineTotal($quantity, $salePrice), $currency, $rate);

        $item ??= new SiteItem(['site_id' => $site->id, 'created_by' => auth()->id()]);

        $item->fill([
            'receipt_id' => $data['receipt_id'] ?? $item->receipt_id,
            'item_import_id' => $data['item_import_id'] ?? $item->item_import_id,
            'type' => $type,
            'currency' => $currency,
            'name' => trim((string) $data['name']),
            'unit' => trim((string) ($data['unit'] ?? 'kom')) ?: 'kom',
            'quantity' => $quantity,
            'purchase_price' => $purchasePrice,
            'sale_price' => $salePrice,
            'exchange_rate' => $rate,
            'purchase_total_rsd' => $purchase['rsd'],
            'purchase_total_eur' => $purchase['eur'],
            'sale_total_rsd' => $sale['rsd'],
            'sale_total_eur' => $sale['eur'],
            'note' => $data['note'] ?? null,
            'is_billable' => array_key_exists('is_billable', $data) && $data['is_billable'] !== null
                ? (bool) $data['is_billable']
                : $type->isBillableByDefault(),
            'is_purchase_estimated' => $estimated,
            'occurred_at' => $day,
        ])->save();

        return $item;
    }
}

<?php

namespace App\Actions\Receipt\Admin;

use App\Actions\ExchangeRate\Shared\ResolveExchangeRateAction;
use App\Actions\SiteItem\Admin\SaveSiteItemAction;
use App\Enums\Currency;
use App\Enums\ReceiptStatus;
use App\Models\Receipt;
use App\Traits\Core\AsAction;
use Illuminate\Validation\ValidationException;

class ImportReceiptItemsAction
{
    use AsAction;

    public function __construct(
        private readonly ResolveExchangeRateAction $resolveExchangeRateAction,
        private readonly SaveSiteItemAction $saveSiteItemAction,
    ) {}

    /**
     * Izabrane stavke sa racuna postaju stavke gradilista (cene u dinarima, kurs na dan racuna).
     *
     * @param array<int, array<string, mixed>> $items
     *
     * @throws ValidationException
     */
    public function handle(Receipt $receipt, array $items): int
    {
        if ($receipt->status !== ReceiptStatus::FETCHED) {
            throw ValidationException::withMessages(['items' => __('receipt_not_fetched')]);
        }

        $site = $receipt->site;
        $day = ($receipt->issued_at ?? now('Europe/Belgrade'))->format('Y-m-d');
        $rate = $this->resolveExchangeRateAction->handle($day);

        foreach ($items as $item) {
            $this->saveSiteItemAction->handle($site, [
                'type' => $item['type'],
                'currency' => Currency::RSD->value,
                'name' => $item['name'],
                'unit' => $item['unit'] ?? 'kom',
                'quantity' => $item['quantity'],
                'purchase_price' => $item['purchase_price'],
                'sale_price' => $item['sale_price'] ?? 0,
                'is_billable' => $item['is_billable'] ?? null,
                'occurred_at' => $day,
                'exchange_rate' => $rate,
                'receipt_id' => $receipt->id,
            ]);
        }

        return count($items);
    }
}

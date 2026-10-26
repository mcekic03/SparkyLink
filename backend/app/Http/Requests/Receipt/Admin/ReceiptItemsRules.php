<?php

namespace App\Http\Requests\Receipt\Admin;

use App\Classes\Utilities\Money;
use App\Classes\Utilities\Ruly;
use App\Enums\ItemType;

/**
 * Pravila za stavke koje se uvoze sa fiskalnog racuna (pri cuvanju racuna ili kasnije).
 */
trait ReceiptItemsRules
{
    /**
     * @return array<string, array<int, mixed>>
     */
    protected function itemRules(bool $required): array
    {
        return [
            'items' => Ruly::make($required)->array()->max(500)->assign(),
            'items.*.type' => Ruly::make(true)->integer()->enum(ItemType::class)->assign(),
            'items.*.name' => Ruly::make(true)->fullString()->assign(),
            'items.*.unit' => Ruly::make(false)->fullString(20)->assign(),
            'items.*.quantity' => Ruly::make(true)->numeric()->greaterThan(0)->assign(),
            'items.*.purchase_price' => Ruly::make(true)->numeric()->min(0)->assign(),
            'items.*.sale_price' => Ruly::make(false)->numeric()->min(0)->assign(),
            'items.*.is_billable' => Ruly::make(false)->boolean()->assign(),
        ];
    }

    protected function normalizeItemDecimals(): void
    {
        $items = $this->input('items');

        if (! is_array($items)) {
            return;
        }

        foreach ($items as $index => $item) {
            foreach (['quantity', 'purchase_price', 'sale_price'] as $field) {
                if (is_array($item) && isset($item[$field]) && is_string($item[$field]) && trim($item[$field]) !== '') {
                    $items[$index][$field] = Money::normalize($item[$field]);
                }
            }
        }

        $this->merge(['items' => $items]);
    }
}

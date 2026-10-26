<?php

namespace App\Http\Requests\SiteItem\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Enums\Currency;
use App\Enums\ItemType;
use App\Traits\FormRequest\NormalizesDecimals;

class SiteItemRequest extends LocalizedFormRequest
{
    use NormalizesDecimals;

    public function rules(): array
    {
        return [
            'type' => Ruly::make(true)->integer()->enum(ItemType::class)->assign(),
            'currency' => Ruly::make(true)->integer()->enum(Currency::class)->assign(),
            'name' => Ruly::make(true)->fullString()->assign(),
            'unit' => Ruly::make(false)->fullString(20)->assign(),
            'quantity' => Ruly::make(true)->numeric()->greaterThan(0)->max(99_999_999)->assign(),
            'purchase_price' => Ruly::make(false)->numeric()->min(0)->max(999_999_999)->assign(),
            'sale_price' => Ruly::make(false)->numeric()->min(0)->max(999_999_999)->assign(),
            'exchange_rate' => Ruly::make(false)->numeric()->greaterThan(0)->max(100_000)->assign(),
            'occurred_at' => Ruly::make(true)->dateFormat('Y-m-d')->assign(),
            'note' => Ruly::make(false)->text()->assign(),
            'is_billable' => Ruly::make(false)->boolean()->assign(),
            // Nabavna jos nije upisana: racuna se kao cena za investitora (vidi SaveSiteItemAction).
            'is_purchase_estimated' => Ruly::make(false)->boolean()->assign(),
        ];
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->normalizeDecimals(['quantity', 'purchase_price', 'sale_price', 'exchange_rate']);
    }
}

<?php

namespace App\Http\Requests\PriceList\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Enums\Currency;
use App\Enums\ItemType;
use App\Traits\FormRequest\NormalizesDecimals;

class PriceListItemRequest extends LocalizedFormRequest
{
    use NormalizesDecimals;

    public function rules(): array
    {
        return [
            'type' => Ruly::make(true)->integer()->enum(ItemType::class)->assign(),
            'currency' => Ruly::make(true)->integer()->enum(Currency::class)->assign(),
            'name' => Ruly::make(true)->fullString()->assign(),
            'unit' => Ruly::make(false)->fullString(20)->assign(),
            'purchase_price' => Ruly::make(false)->numeric()->min(0)->max(999_999_999)->assign(),
            'sale_price' => Ruly::make(false)->numeric()->min(0)->max(999_999_999)->assign(),
            'is_active' => Ruly::make(false)->boolean()->assign(),
        ];
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->normalizeDecimals(['purchase_price', 'sale_price']);
    }
}

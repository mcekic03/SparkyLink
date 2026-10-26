<?php

namespace App\Http\Requests\LaborEntry\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Enums\Currency;
use App\Traits\FormRequest\NormalizesDecimals;

class LaborEntryRequest extends LocalizedFormRequest
{
    use NormalizesDecimals;

    public function rules(): array
    {
        return [
            'currency' => Ruly::make(true)->integer()->enum(Currency::class)->assign(),
            'workers_count' => Ruly::make(true)->integer()->min(1)->max(500)->assign(),
            'hours' => Ruly::make(true)->numeric()->greaterThan(0)->max(24)->assign(),
            'hourly_rate' => Ruly::make(true)->numeric()->min(0)->max(999_999)->assign(),
            'exchange_rate' => Ruly::make(false)->numeric()->greaterThan(0)->max(100_000)->assign(),
            'worked_at' => Ruly::make(true)->dateFormat('Y-m-d')->assign(),
            'description' => Ruly::make(false)->fullString()->assign(),
        ];
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->normalizeDecimals(['hours', 'hourly_rate', 'exchange_rate']);
    }
}

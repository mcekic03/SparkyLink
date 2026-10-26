<?php

namespace App\Http\Requests\Payment\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Enums\Currency;
use App\Traits\FormRequest\NormalizesDecimals;

class PaymentRequest extends LocalizedFormRequest
{
    use NormalizesDecimals;

    public function rules(): array
    {
        return [
            'currency' => Ruly::make(true)->integer()->enum(Currency::class)->assign(),
            'amount' => Ruly::make(true)->numeric()->greaterThan(0)->max(999_999_999)->assign(),
            'exchange_rate' => Ruly::make(false)->numeric()->greaterThan(0)->max(100_000)->assign(),
            'paid_at' => Ruly::make(true)->dateFormat('Y-m-d')->assign(),
            'note' => Ruly::make(false)->fullString()->assign(),
        ];
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->normalizeDecimals(['amount', 'exchange_rate']);
    }
}

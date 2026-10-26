<?php

namespace App\Http\Requests\ExchangeRate\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Traits\FormRequest\NormalizesDecimals;

class ExchangeRateRequest extends LocalizedFormRequest
{
    use NormalizesDecimals;

    public function rules(): array
    {
        return [
            'effective_at' => Ruly::make(true)->dateFormat('Y-m-d')->assign(),
            'rate' => Ruly::make(true)->numeric()->greaterThan(0)->max(100_000)->assign(),
        ];
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->normalizeDecimals(['rate']);
    }
}

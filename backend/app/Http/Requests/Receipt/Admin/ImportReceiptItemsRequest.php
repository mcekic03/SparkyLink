<?php

namespace App\Http\Requests\Receipt\Admin;

use App\Classes\LocalizedFormRequest;

/**
 * Naknadni uvoz stavki sa racuna koji je preuzet posle cuvanja (bio je "ceka preuzimanje").
 */
class ImportReceiptItemsRequest extends LocalizedFormRequest
{
    use ReceiptItemsRules;

    public function rules(): array
    {
        return $this->itemRules(true);
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->normalizeItemDecimals();
    }
}

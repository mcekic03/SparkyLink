<?php

namespace App\Http\Requests\Receipt\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;

/**
 * Cuvanje racuna uz gradiliste: link sa QR koda (i izabrane stavke) i/ili slika racuna.
 */
class StoreReceiptRequest extends LocalizedFormRequest
{
    use ReceiptItemsRules;

    public function rules(): array
    {
        return [
            'qr_url' => Ruly::make()->requiredWithout('photo')->nullable()->string()->max(4000)->assign(),
            'photo' => Ruly::make()->requiredWithout('qr_url')->nullable()->image(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'], 25_600)->assign(),
            'note' => Ruly::make(false)->text()->assign(),
            'store_name' => Ruly::make(false)->fullString()->assign(),
            'issued_at' => Ruly::make(false)->dateFormat('Y-m-d')->assign(),
            ...$this->itemRules(false),
        ];
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->normalizeItemDecimals();
    }
}

<?php

namespace App\Http\Requests\Receipt\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;

class PreviewReceiptRequest extends LocalizedFormRequest
{
    public function rules(): array
    {
        return [
            'qr_url' => Ruly::make(true)->string()->max(4000)->assign(),
            // Nazive sa cirilicnih racuna prevesti u latinicu.
            'transliterate' => Ruly::make(false)->boolean()->assign(),
        ];
    }
}

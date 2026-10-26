<?php

namespace App\Http\Requests\Document\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Enums\DocumentType;

class StoreDocumentRequest extends LocalizedFormRequest
{
    public function rules(): array
    {
        return [
            'type' => Ruly::make(true)->integer()->enum(DocumentType::class)->assign(),
            'issued_at' => Ruly::make(false)->dateFormat('Y-m-d')->assign(),
            'note' => Ruly::make(false)->text()->assign(),
            // false = materijal kao jedan red "Materijal" umesto po stavkama.
            'is_itemized' => Ruly::make(false)->boolean()->assign(),
        ];
    }
}

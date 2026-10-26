<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Models\Document;
use Illuminate\Http\Request;

/** @mixin Document */
class DocumentResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'number' => $this->number,
            'currency' => $this->currency->value,
            'exchange_rate' => $this->exchange_rate,
            'total_amount' => $this->total_amount,
            'paid_amount' => $this->paid_amount,
            'balance_amount' => $this->balance_amount,
            'is_itemized' => $this->is_itemized,
            'note' => $this->note,
            'pdf_url' => signed_file_url('api.files.documents', ['document' => $this->id]),
            'issued_at' => $this->issued_at->format('Y-m-d'),
            'created_at' => $this->created_at,
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Models\PriceListItem;
use Illuminate\Http\Request;

/** @mixin PriceListItem */
class PriceListItemResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'currency' => $this->currency->value,
            'name' => $this->name,
            'unit' => $this->unit,
            'purchase_price' => $this->purchase_price,
            'sale_price' => $this->sale_price,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at,
        ];
    }
}

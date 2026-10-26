<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Models\SiteItem;
use Illuminate\Http\Request;

/** @mixin SiteItem */
class SiteItemResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'receipt_id' => $this->receipt_id,
            'type' => $this->type->value,
            'type_label' => $this->type->label(),
            'currency' => $this->currency->value,
            'name' => $this->name,
            'unit' => $this->unit,
            'quantity' => $this->quantity,
            'purchase_price' => $this->purchase_price,
            'sale_price' => $this->sale_price,
            'exchange_rate' => $this->exchange_rate,
            'purchase_total_rsd' => $this->purchase_total_rsd,
            'purchase_total_eur' => $this->purchase_total_eur,
            'sale_total_rsd' => $this->sale_total_rsd,
            'sale_total_eur' => $this->sale_total_eur,
            'note' => $this->note,
            'is_billable' => $this->is_billable,
            'is_purchase_estimated' => (bool) $this->is_purchase_estimated,
            'item_import_id' => $this->item_import_id,
            'item_import' => $this->whenLoaded('itemImport', fn () => $this->itemImport ? [
                'id' => $this->itemImport->id,
                'file_name' => $this->itemImport->file_name,
                'created_at' => $this->itemImport->created_at,
            ] : null),
            'occurred_at' => $this->occurred_at->format('Y-m-d'),
            'created_at' => $this->created_at,
        ];
    }
}

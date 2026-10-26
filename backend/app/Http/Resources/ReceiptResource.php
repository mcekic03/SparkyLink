<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Models\Receipt;
use Illuminate\Http\Request;

/**
 * Fiskalni racun. Tekst racuna (`journal`) i stavke sa racuna samo u detalju.
 *
 * @mixin Receipt
 */
class ReceiptResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        $detailed = $request->routeIs('admin.receipts.show', 'admin.receipts.refetch', 'admin.sites.receipts.store');

        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'site_name' => $this->whenLoaded('site', fn () => $this->site?->name),
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'qr_url' => $this->qr_url,
            'store_name' => $this->store_name,
            'store_tin' => $this->store_tin,
            'store_address' => $this->store_address,
            'store_city' => $this->store_city,
            'store_location' => $this->store_location,
            'receipt_number' => $this->receipt_number,
            'receipt_counter' => $this->receipt_counter,
            'total_amount' => $this->total_amount,
            'note' => $this->note,
            'fetch_error' => $this->fetch_error,
            'items_count' => $this->whenCounted('items'),
            'journal' => $this->when($detailed, $this->journal),
            'items_data' => $this->when($detailed, $this->items_data),
            'photo_url' => $this->photo_path ? signed_file_url('api.files.receipts.photo', ['receipt' => $this->id]) : null,
            'copy_url' => signed_file_url('api.files.receipts.copy', ['receipt' => $this->id]),
            'issued_at' => $this->issued_at,
            'fetched_at' => $this->fetched_at,
            'created_at' => $this->created_at,
        ];
    }
}

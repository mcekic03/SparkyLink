<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Models\Payment;
use Illuminate\Http\Request;

/** @mixin Payment */
class PaymentResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'currency' => $this->currency->value,
            'amount' => $this->amount,
            'exchange_rate' => $this->exchange_rate,
            'amount_rsd' => $this->amount_rsd,
            'amount_eur' => $this->amount_eur,
            'note' => $this->note,
            'paid_at' => $this->paid_at->format('Y-m-d'),
            'created_at' => $this->created_at,
        ];
    }
}

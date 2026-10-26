<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Models\ExchangeRate;
use Illuminate\Http\Request;

/** @mixin ExchangeRate */
class ExchangeRateResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'currency' => $this->currency->value,
            'source' => $this->source->value,
            'rate' => $this->rate,
            'effective_at' => $this->effective_at->format('Y-m-d'),
            'updated_at' => $this->updated_at,
        ];
    }
}

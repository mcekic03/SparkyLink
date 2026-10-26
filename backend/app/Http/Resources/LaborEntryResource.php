<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Models\LaborEntry;
use Illuminate\Http\Request;

/** @mixin LaborEntry */
class LaborEntryResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'currency' => $this->currency->value,
            'workers_count' => $this->workers_count,
            'hours' => $this->hours,
            'hourly_rate' => $this->hourly_rate,
            'exchange_rate' => $this->exchange_rate,
            'total_rsd' => $this->total_rsd,
            'total_eur' => $this->total_eur,
            'description' => $this->description,
            'worked_at' => $this->worked_at->format('Y-m-d'),
            'created_at' => $this->created_at,
        ];
    }
}

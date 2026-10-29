<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Classes\Utilities\SiteFinancials;
use App\Models\Site;
use Illuminate\Http\Request;

/**
 * Gradiliste; finansije su tu kad su zbirovi ucitani (Site::withFinancials()).
 *
 * @mixin Site
 */
class SiteResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        $hasFinancials = array_key_exists('billed_eur', $this->resource->getAttributes());

        return [
            'id' => $this->id,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'currency' => $this->currency->value,
            'name' => $this->name,
            'address' => $this->address,
            'city' => $this->city,
            'investor_name' => $this->investor_name,
            'investor_phone' => $this->investor_phone,
            'investor_email' => $this->investor_email,
            'investor_address' => $this->investor_address,
            'description' => $this->description,
            'markup_percent' => $this->markup_percent,
            'effective_markup_percent' => $this->effectiveMarkupPercent(),
            'started_at' => $this->started_at?->format('Y-m-d'),
            'completed_at' => $this->completed_at?->format('Y-m-d'),
            'financials' => $this->when($hasFinancials, fn () => SiteFinancials::fromSite($this->resource)->toArray()),
            'is_deleted' => $this->trashed(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

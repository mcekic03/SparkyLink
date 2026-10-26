<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

/** @mixin ActivityLog */
class ActivityLogResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'subject_id' => $this->when(
                $this->relationLoaded('subject') && ! is_null($this->subject),
                fn () => $this->subject_id
            ),
            'event' => $this->whenHas('event'),
            'message' => $this->whenHas('loggable_name', fn () => $this->message),
            'attributes' => $this->whenHas('properties', fn () => $this->changes?->get('attributes')),
            'old_attributes' => $this->whenHas('properties', fn () => $this->changes?->get('old')),
            'created_at' => $this->whenHas('created_at'),
            'causer' => new UserResource($this->whenLoaded('causer')),
        ];
    }
}

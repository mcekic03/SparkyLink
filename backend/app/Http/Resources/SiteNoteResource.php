<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Models\SiteNote;
use Illuminate\Http\Request;

/** @mixin SiteNote */
class SiteNoteResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'body' => $this->body,
            'author' => $this->whenLoaded('user', fn () => $this->user?->name),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

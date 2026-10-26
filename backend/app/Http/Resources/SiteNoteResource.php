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
        $user = $request->user();

        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'body' => $this->body,
            'author' => $this->whenLoaded('user', fn () => $this->user?->name),
            // Napomenu menja autor ili neko ko vidi finansije (vlasnik/administrator).
            'can_edit' => $user !== null && ($user->id === $this->user_id || $user->canViewFinances()),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

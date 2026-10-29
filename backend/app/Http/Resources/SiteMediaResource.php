<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Models\SiteMedia;
use Illuminate\Http\Request;

/**
 * Slika/video. Fajlovi su privatni - linkovi su relativni, potpisani i vremenski ograniceni.
 *
 * @mixin SiteMedia
 */
class SiteMediaResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'type' => $this->type->value,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'width' => $this->width,
            'height' => $this->height,
            'caption' => $this->caption,
            'author' => $this->whenLoaded('user', fn () => $this->user?->name),
            'url' => signed_file_url('api.files.media', ['media' => $this->id]),
            'thumbnail_url' => $this->thumbnail_path
                ? signed_file_url('api.files.media', ['media' => $this->id, 'variant' => 'thumb'])
                : null,
            'taken_at' => $this->taken_at,
            'created_at' => $this->created_at,
        ];
    }
}

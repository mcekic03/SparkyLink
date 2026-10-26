<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Models\Media;
use Illuminate\Http\Request;

/** @mixin Media */
class MediaResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        return [
            'id' => $this->whenHas('id'),
            'type' => $this->whenHas('type'),
            'url' => $this->whenHas('url'),
            'name' => $this->whenHas('name'),
            'size' => $this->whenHas('size'),
            'extension' => $this->whenHas('extension'),
            'width' => $this->whenHas('width'),
            'height' => $this->whenHas('height'),
            'created_at' => $this->whenHas('created_at'),
        ];
    }
}

<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Enums\FuseBoardTemplate;
use App\Models\Fuse;
use App\Models\FuseBoard;
use Illuminate\Http\Request;

/** @mixin FuseBoard */
class FuseBoardResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'site_id' => $this->site_id,
            'name' => $this->name,
            'fuses' => $this->fuses->map(fn (Fuse $fuse) => [
                'number' => $fuse->position,
                'name' => $fuse->name,
                'type' => $fuse->type->value,
                'rating' => $fuse->rating->value,
            ])->all(),
            // PDF se pravi tek kad se link otvori, od onoga sto je tada sacuvano.
            'pdf_urls' => array_map(fn (FuseBoardTemplate $template) => [
                'template' => $template->value,
                'url' => signed_file_url('api.files.fuse-boards', ['fuseBoard' => $this->id, 'template' => $template->value]),
            ], FuseBoardTemplate::cases()),
        ];
    }
}

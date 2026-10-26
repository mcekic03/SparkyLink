<?php

namespace App\Http\Resources;

use App\Classes\TimezoneAwareResource;
use App\Models\User;
use Illuminate\Http\Request;

/** @mixin User */
class UserResource extends TimezoneAwareResource
{
    public function fromArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'role_id' => $this->whenHas('role_id'),
            'name' => $this->whenHas('name'),
            'email' => $this->whenHas('email'),
            'created_at' => $this->whenHas('created_at'),
        ];
    }
}

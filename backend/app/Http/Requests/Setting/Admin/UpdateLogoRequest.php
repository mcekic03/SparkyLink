<?php

namespace App\Http\Requests\Setting\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;

class UpdateLogoRequest extends LocalizedFormRequest
{
    public function rules(): array
    {
        return [
            'logo' => Ruly::make(true)->image(['png', 'jpg', 'jpeg', 'webp'], 5120)->assign(),
        ];
    }
}

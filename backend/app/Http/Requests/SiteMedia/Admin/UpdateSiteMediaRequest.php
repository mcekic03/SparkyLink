<?php

namespace App\Http\Requests\SiteMedia\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;

class UpdateSiteMediaRequest extends LocalizedFormRequest
{
    public function rules(): array
    {
        return [
            'caption' => Ruly::make(false)->fullString()->assign(),
        ];
    }
}

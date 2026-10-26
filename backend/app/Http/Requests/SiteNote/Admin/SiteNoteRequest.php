<?php

namespace App\Http\Requests\SiteNote\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;

class SiteNoteRequest extends LocalizedFormRequest
{
    public function rules(): array
    {
        return [
            'body' => Ruly::make(true)->string()->max(5000)->assign(),
        ];
    }
}

<?php

namespace App\Http\Requests\Shared;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;

class StoreMediaRequest extends LocalizedFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'media' => Ruly::make(true)
                           ->array()
                           ->size(1)
                           ->assign(),
            'media.*' => Ruly::make(true)
                             ->image()
                             ->assign(),
        ];
    }
}

<?php

namespace App\Http\Requests\Shared;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;

class DateFilterRequest extends LocalizedFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date_from' => [
                ...Ruly::make(false)->date()->assign(),
                $this->date_to ? 'before:date_to' : '',
            ],
            'date_to' => Ruly::make(false)
                             ->date()
                             ->before('tomorrow')
                             ->after('date_from')
                             ->assign(),
        ];
    }
}

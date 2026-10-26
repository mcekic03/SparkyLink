<?php

namespace App\Http\Requests\Dashboard\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;

class DashboardRequest extends LocalizedFormRequest
{
    public function rules(): array
    {
        return [
            'from' => Ruly::make(false)->dateFormat('Y-m-d')->assign(),
            'to' => Ruly::make(false)->dateFormat('Y-m-d')->assign(),
        ];
    }
}

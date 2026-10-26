<?php

namespace App\Http\Requests\Auth\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;

class LoginUserRequest extends LocalizedFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => Ruly::make(true)
                           ->email()
                           ->assign(),
            'password' => Ruly::make(true)
                              ->string()
                              ->assign(),
        ];
    }
}

<?php

namespace App\Http\Requests\Shared;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Models\User;

class PasswordResetRequest extends LocalizedFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => Ruly::make(true)
                           ->fullString()
                           ->assign(),
            'email' => Ruly::make(true)
                           ->fullString()
                           ->email()
                           ->exists(User::class, 'email')
                           ->assign(),
            'password' => Ruly::make(true)
                              ->fullString()
                              ->password()
                              ->confirmed()
                              ->assign(),
        ];
    }
}

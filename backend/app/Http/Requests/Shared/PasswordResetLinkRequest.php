<?php

namespace App\Http\Requests\Shared;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Models\User;

class PasswordResetLinkRequest extends LocalizedFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => Ruly::make(true)
                           ->fullString()
                           ->email()
                           ->exists(User::class, 'email')
                           ->assign(),
        ];
    }
}

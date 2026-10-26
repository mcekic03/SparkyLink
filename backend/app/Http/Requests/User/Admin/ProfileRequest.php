<?php

namespace App\Http\Requests\User\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Models\User;

class ProfileRequest extends LocalizedFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => Ruly::make(true)
                          ->fullString()
                          ->assign(),
            'email' => Ruly::make(true)
                           ->email()
                           ->uniqueWithIgnore(User::class, 'email', auth()->user())
                           ->assign(),
            'password' => Ruly::make()
                              ->string()
                              ->password()
                              ->confirmed()
                              ->assign(),
        ];
    }
}

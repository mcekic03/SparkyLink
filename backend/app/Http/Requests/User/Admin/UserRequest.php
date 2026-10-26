<?php

namespace App\Http\Requests\User\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Enums\Role;
use App\Models\User;

class UserRequest extends LocalizedFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'role_id' => Ruly::make(true)
                             ->integer()
                             ->enum(Role::class)
                             ->assign(),
            'name' => Ruly::make(true)
                          ->fullString()
                          ->assign(),
            'email' => Ruly::make(true)
                           ->email()
                           ->uniqueWithIgnore(User::class, 'email', $user)
                           ->assign(),
            'password' => Ruly::make()
                              ->requiredIf(! $user)
                              ->string()
                              ->password()
                              ->confirmed()
                              ->assign(),
        ];
    }
}

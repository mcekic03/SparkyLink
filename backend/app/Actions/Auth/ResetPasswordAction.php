<?php

namespace App\Actions\Auth;

use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class ResetPasswordAction
{
    /**
     * @throws ValidationException
     */
    public function handle(array $credentials): string
    {
        $status = Password::reset(
            $credentials,
            function ($user, $password) {
                $user->patch(['password' => $password]);

                event(new PasswordReset($user));
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'status' => __($status),
            ]);
        }

        return $status;
    }
}

<?php

namespace App\Actions\Auth;

use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class RequestPasswordResetAction
{
    /**
     * @throws ValidationException
     */
    public function handle(array $credentials): string
    {
        $status = Password::sendResetLink($credentials);

        if ($status !== Password::RESET_LINK_SENT) {
            throw ValidationException::withMessages([
                'status' => __($status),
            ]);
        }

        return $status;
    }
}

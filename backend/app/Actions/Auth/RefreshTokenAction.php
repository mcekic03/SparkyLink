<?php

namespace App\Actions\Auth;

use App\Models\User;
use App\Traits\Core\AsAction;

class RefreshTokenAction
{
    use AsAction;

    /**
     * Izdaje novi token i brise onaj kojim je zahtev poslat.
     *
     * @return array{user: User, token: string}
     */
    public function handle(User $user): array
    {
        $user->currentAccessToken()?->delete();

        return [
            'user' => $user,
            'token' => $user->createToken('')->plainTextToken,
        ];
    }
}

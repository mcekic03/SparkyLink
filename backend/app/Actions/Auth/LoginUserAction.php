<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LoginUserAction
{
    /**
     * @throws ValidationException
     */
    public function handle(string $email, string $password): array
    {
        $user = User::query()->where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        //        activity()
        //            ->causedBy($user)
        //            ->performedOn($user)
        //            ->tap(fn (Activity $activity) => $activity->loggable_name = $user->name)
        //            ->event(LogEventType::LOGIN->value)
        //            ->log(str(LogEventType::LOGIN->value)->title());

        return [
            'user' => $user,
            'token' => $user->createToken('')->plainTextToken,
        ];
    }
}

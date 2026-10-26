<?php

namespace App\Http\Controllers\Auth\Admin;

use App\Actions\Auth\LoginUserAction;
use App\Actions\Auth\RefreshTokenAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\Admin\LoginUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function login(LoginUserRequest $request, LoginUserAction $loginUserAction): JsonResponse
    {
        $loginData = $loginUserAction->handle(
            email: $request->get('email'),
            password: $request->get('password')
        );

        return $this->sessionResponse(__('login_successful'), $loginData);
    }

    public function refresh(): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();

        $sessionData = RefreshTokenAction::make()->handle($user);

        return $this->sessionResponse(__('token_refreshed'), $sessionData);
    }

    public function logout(): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();

        $user->currentAccessToken()->delete();

        return response()->success(__('logout_successful'));
    }

    /**
     * @param array{user: User, token: string} $sessionData
     */
    private function sessionResponse(string $message, array $sessionData): JsonResponse
    {
        return response()->json([
            'message' => $message,
            'token' => $sessionData['token'],
            'expires_in' => config('sanctum.expiration') * 60,
            'data' => new UserResource($sessionData['user']),
        ]);
    }
}

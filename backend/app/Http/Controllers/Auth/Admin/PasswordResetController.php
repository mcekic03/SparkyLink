<?php

namespace App\Http\Controllers\Auth\Admin;

use App\Actions\Auth\RequestPasswordResetAction;
use App\Actions\Auth\ResetPasswordAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Shared\PasswordResetLinkRequest;
use App\Http\Requests\Shared\PasswordResetRequest;
use Illuminate\Http\JsonResponse;

class PasswordResetController extends Controller
{
    public function request(PasswordResetLinkRequest $request, RequestPasswordResetAction $requestPasswordResetAction): JsonResponse
    {
        $status = $requestPasswordResetAction->handle(credentials: $request->validated());

        return response()->success(__($status));
    }

    public function reset(PasswordResetRequest $request, ResetPasswordAction $resetPasswordAction): JsonResponse
    {
        $status = $resetPasswordAction->handle(credentials: $request->validated());

        return response()->success(__($status));
    }
}

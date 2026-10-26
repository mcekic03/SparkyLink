<?php

namespace App\Http\Controllers\User\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\Admin\ProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->success(data: new UserResource(auth()->user()));
    }

    public function update(ProfileRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();

        $user->patch($request->validated());

        return response()->success(__('profile_update_successful'));
    }

    public function destroy(): JsonResponse
    {
        /** @var User $user */
        $user = auth()->user();

        $user->tokens()->delete();

        $user->delete();

        return response()->success(__('profile_deletion_successful'));
    }
}

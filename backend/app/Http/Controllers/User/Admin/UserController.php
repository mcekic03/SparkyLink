<?php

namespace App\Http\Controllers\User\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\Admin\UserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    public function index(): JsonResponse
    {
        $users = User::query()
                     ->filters()
                     ->paginate(request('per_page', 10));

        return response()->success(
            data: UserResource::collection($users),
            pagination: generate_pagination_data($users)
        );
    }

    public function show(User $user): JsonResponse
    {
        return response()->success(data: new UserResource($user));
    }

    public function store(UserRequest $request): JsonResponse
    {
        User::store($request->validated());

        return response()->success(__('user_creation_successful'));
    }

    public function update(UserRequest $request, User $user): JsonResponse
    {
        $user->patch($request->validated());

        return response()->success(__('user_update_successful'));
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->success(__('user_deletion_successful'));
    }
}

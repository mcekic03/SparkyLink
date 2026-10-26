<?php

use App\Enums\Role;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('login returns a token, expiry and the role, and the token can be refreshed and revoked', function () {
    $login = $this->postJson('/api/admin/login', ['email' => config('app.admin_email'), 'password' => config('app.secret_password')])->assertOk();

    expect($login->json('token'))->not->toBeEmpty()
        ->and($login->json('data.role_id'))->toBe(Role::SUPER_ADMIN->value);

    $token = $login->json('token');
    $superAdmin = superAdmin();

    $refresh = $this->withToken($token)->postJson('/api/admin/refresh')->assertOk();
    expect($refresh->json('token'))->not->toBe($token)
        ->and($superAdmin->tokens()->count())->toBe(1);

    app('auth')->forgetGuards();
    $this->withToken($token)->getJson('/api/admin/sites')->assertUnauthorized();

    app('auth')->forgetGuards();
    $this->withToken($refresh->json('token'))->getJson('/api/admin/sites')->assertOk();

    app('auth')->forgetGuards();
    $this->withToken($refresh->json('token'))->postJson('/api/admin/logout')->assertOk();
    expect($superAdmin->tokens()->count())->toBe(0);
});

test('wrong credentials are a validation error, not a session failure', function () {
    $this->postJson('/api/admin/login', ['email' => 'admin@sparkylink.rs', 'password' => 'wrong'])
         ->assertUnprocessable()
         ->assertJsonValidationErrors('email');
});

test('a plain admin cannot reach user management, a worker cannot reach finances', function () {
    Sanctum::actingAs(plainAdmin());
    $this->getJson('/api/admin/users')->assertNotFound();

    Sanctum::actingAs(worker());
    $this->getJson('/api/admin/dashboard')->assertNotFound();
    $this->getJson('/api/admin/price-list-items')->assertNotFound();
    $this->postJson('/api/admin/sites', ['name' => 'X', 'status' => 2, 'currency' => 2])->assertNotFound();
});

test('a super admin can create a worker account and change its role', function () {
    Sanctum::actingAs(superAdmin());

    $this->postJson('/api/admin/users', [
        'name' => 'Radnik Petar',
        'email' => 'petar@sparkylink.rs',
        'role_id' => Role::WORKER->value,
        'password' => 'Lozinka!123',
        'password_confirmation' => 'Lozinka!123',
    ])->assertOk();

    $user = User::query()->where('email', 'petar@sparkylink.rs')->firstOrFail();
    expect($user->role_id)->toBe(Role::WORKER)
        ->and($user->canViewFinances())->toBeFalse();

    $this->putJson("/api/admin/users/{$user->id}", [
        'name' => 'Petar',
        'email' => 'petar@sparkylink.rs',
        'role_id' => Role::ADMIN->value,
    ])->assertOk();

    expect($user->fresh()->role_id)->toBe(Role::ADMIN);

    $this->deleteJson("/api/admin/users/{$user->id}")->assertOk();
    expect(User::query()->whereKey($user->id)->exists())->toBeFalse();
});

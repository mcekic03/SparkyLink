<?php

use App\Enums\Role;

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

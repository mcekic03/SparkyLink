<?php

namespace App\Providers;

use App\Enums\Role;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        // 'App\Models\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot(): void
    {
        // Making sure super admin is allowed to do anything
        Gate::before(function ($user) {
            return $user->hasRole(role: Role::SUPER_ADMIN) ? true : null;
        });

        // Custom reset password URL which routes to SPA frontend application
        ResetPassword::createUrlUsing(function (mixed $user, string $token) {
            return spa_url("/password-reset?token={$token}&email={$user->getEmailForPasswordReset()}");
        });
    }
}

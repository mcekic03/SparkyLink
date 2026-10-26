<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            Route::middleware('api')
                 ->prefix('api')
                 ->as('api.')
                 ->group(base_path('routes/api.php'));

            Route::middleware(['api', 'auth:sanctum'])
                 ->prefix('api/admin')
                 ->as('admin.')
                 ->group(base_path('routes/admin.php'));

            Route::middleware(['web', 'content-security'])
                 ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Ogranicenja vaze samo u produkciji (kao u sablonu), da lokalno testiranje ne zapinje.
     */
    protected function configureRateLimiting(): void
    {
        // Otpremanje vise slika/videa sa gradilista i skeniranje racuna salju dosta zahteva.
        RateLimiter::for('api', function (Request $request) {
            return app()->environment('production')
                ? Limit::perMinute(240)->by($request->user()?->id ?: client_ip())
                : Limit::none();
        });

        RateLimiter::for('authentication', function (Request $request) {
            return app()->environment('production')
                ? Limit::perMinutes(30, 10)->by($request->user()?->id ?: client_ip())
                : Limit::none();
        });
    }
}

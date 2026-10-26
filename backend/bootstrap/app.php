<?php

use App\Http\Middleware\ContentSecurity;
use App\Http\Middleware\EnsureUserHasRole;
use App\Http\Middleware\SanitizeRequestParams;
use App\Http\Middleware\SetClientLocale;
use App\Http\Middleware\SetClientTimezone;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
                  ->withRouting(
                      commands: __DIR__ . '/../routes/console.php',
                      health: '/up',
                  )
                  ->withMiddleware(function (Middleware $middleware) {
                      // Global
                      $middleware->append([
                          SetClientLocale::class,
                          SetClientTimezone::class,
                          SanitizeRequestParams::class,
                      ]);

                      $middleware->trustProxies(at: '*');

                      // API
                      $middleware->api(prepend: [
                          'throttle:api',
                      ]);

                      $middleware->alias([
                          'role' => EnsureUserHasRole::class,
                          'content-security' => ContentSecurity::class,
                      ]);
                  })
                  ->withExceptions(function (Exceptions $exceptions) {
                      //
                  })->create();

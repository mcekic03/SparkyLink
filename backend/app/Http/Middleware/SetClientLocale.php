<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetClientLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestedLocale = $request->header('X-Client-Locale', config('app.locale'));

        $locale = in_array($requestedLocale, config('app.available_locales'))
            ? $requestedLocale
            : config('app.fallback_locale');

        App::setLocale($locale);

        return $next($request);
    }
}

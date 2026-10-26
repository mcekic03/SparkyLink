<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Config;
use Symfony\Component\HttpFoundation\Response;

class SetClientTimezone
{
    public function handle(Request $request, Closure $next): Response
    {
        $timezone = $request->header('X-Client-Timezone', 'UTC');

        if (! in_array($timezone, all_available_timezones())) {
            $timezone = config('app.timezone');
        }

        Config::set('app.client_timezone', $timezone);

        return $next($request);
    }
}

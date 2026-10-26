<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        if (auth()->check() && auth()->user()->hasAnyRole($roles)) {
            return $next($request);
        }

        abort(Response::HTTP_NOT_FOUND, 'Not found');
    }
}

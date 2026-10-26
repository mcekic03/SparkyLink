<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Facades\Vite;
use Symfony\Component\HttpFoundation\Response;

class ContentSecurity
{
    /**
     * Handle an incoming request.
     *
     * @param Closure(Request): (Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $appUrl = config('app.url') . '/';
        $nonce = Vite::cspNonce();

        $securityHeaders = [
            'Content-Security-Policy' => "default-src 'self'; script-src 'self' 'nonce-{$nonce}' {$appUrl} https://www.google.com/ https://www.gstatic.com/; style-src 'self' 'unsafe-inline' {$appUrl}; img-src 'self' data: {$appUrl}; media-src 'self' data: {$appUrl}; font-src 'self'; object-src 'none'; frame-ancestors 'none'; frame-src 'self' https://www.google.com/; form-action 'self'; upgrade-insecure-requests;",
            'Permissions-Policy' => 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
        ];

        // Add the security headers to be accessible to all views
        // Must be here before next() is called, so that the headers are passed before view rendering
        View::share('securityHeaders', $securityHeaders);

        $response = $next($request);

        $response->headers->add($securityHeaders);

        return $response;
    }
}

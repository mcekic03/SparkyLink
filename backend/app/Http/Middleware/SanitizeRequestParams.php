<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeRequestParams
{
    public function handle(Request $request, Closure $next): Response
    {
        $sanitizeParam = function (&$param) use (&$sanitizeParam) {
            if (is_array($param)) {
                foreach ($param as &$value) {
                    $sanitizeParam($value);
                }
            } elseif (is_string($param) && in_array(strtolower($param), ['undefined', 'null', 'nan'], true)) {
                $param = null;
            }
        };

        $data = $request->all();
        $sanitizeParam($data);

        $request->replace($data);

        return $next($request);
    }
}

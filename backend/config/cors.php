<?php

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
|
| Domeni sajta se zadaju kroz CORS_ALLOWED_ORIGINS (zarezom razdvojeni, npr.
| "https://sparkylink.cekic-elektrik.rs"); SPA je na istom domenu, pa obicno ne treba. Kad promenljiva nije
| zadata, dozvoljen je glavni domen iz APP_URL sa svim poddomenima (lokalno sve).
|
*/

$configuredOrigins = array_values(array_filter(array_map(
    'trim',
    explode(',', (string) env('CORS_ALLOWED_ORIGINS', ''))
)));

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => $configuredOrigins ?: app_allowed_domains(),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 60 * 60 * 24,
    'supports_credentials' => true,
];

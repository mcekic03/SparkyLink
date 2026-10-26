<?php

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;

require __DIR__ . '/Helpers/condition.php';
require __DIR__ . '/Helpers/conversion.php';
require __DIR__ . '/Helpers/database.php';
require __DIR__ . '/Helpers/date.php';
require __DIR__ . '/Helpers/files.php';
require __DIR__ . '/Helpers/localization.php';
require __DIR__ . '/Helpers/request.php';
require __DIR__ . '/Helpers/seeder.php';

if (! function_exists('generate_pagination_data')) {
    /**
     * Generates array of data that is accepted by Angular SPA application on paginated object.
     * This structure is accepted by SPA and must be used through this helper or not.
     */
    function generate_pagination_data(?LengthAwarePaginator $paginator): array
    {
        if (! $paginator) {
            return [
                'total' => 0,
                'per_page' => request('per_page', 25),
                'current_page' => 1,
                'total_pages' => 1,
            ];
        }

        return [
            'total' => $paginator->total(),
            'per_page' => $paginator->perPage(),
            'current_page' => $paginator->currentPage(),
            'total_pages' => $paginator->lastPage(),
        ];
    }
}

if (! function_exists('storage_url')) {
    /**
     * Returns full URL path to the asset provided.
     *
     * @param string|null $path
     *
     * @return string
     */
    function storage_url(?string $path = ''): string
    {
        $path = (string) $path;
        $path = ltrim($path, '/');

        return Storage::disk('public')->url($path);
    }
}

if (! function_exists('public_storage_path')) {
    /**
     * Returns full path to the asset provided within public app directory.
     *
     * @param string|null $path
     *
     * @return string
     */
    function public_storage_path(?string $path = ''): string
    {
        $path = (string) $path;
        $path = ltrim($path, '/');

        return Storage::disk('public')->path($path);
    }
}

if (! function_exists('spa_url')) {
    /**
     * Returns url link to SPA application
     *
     * @param string|null $path
     *
     * @return string
     */
    function spa_url(?string $path = ''): string
    {
        $spaBaseUrl = config('app.spa_url');
        $path = (string) $path;
        $path = ltrim($path, '/');

        return str($spaBaseUrl)->endsWith('/')
            ? $spaBaseUrl . $path
            : "{$spaBaseUrl}/{$path}";
    }
}

if (! function_exists('app_allowed_domains')) {
    /**
     * Gives array of allowed domains/subdomain for application.
     *
     * @return array
     */
    function app_allowed_domains(): array
    {
        if (config('app.env') === 'local') {
            return ['*'];
        }

        $parsedUrl = parse_url(config('app.url'));
        $scheme = $parsedUrl['scheme'];
        $hostParts = explode('.', $parsedUrl['host']);
        $mainDomain = implode('.', array_slice($hostParts, -2, 2));

        $port = array_key_exists('port', $parsedUrl) && $parsedUrl['port']
            ? ":{$parsedUrl['port']}"
            : '';

        return [
            "{$scheme}://{$mainDomain}{$port}", // Scheme is required when no wildcards are used!
            "*.{$mainDomain}{$port}",
        ];
    }
}

if (! function_exists('get_array_from_string')) {
    /**
     * Returns array of elements which are represented as array in database.
     * Values need to be separated by "," separator.
     *
     * @param string|null $str
     *
     * @return array
     */
    function get_array_from_string(?string $str): array
    {
        if (! $str) {
            return [];
        }

        return collect(explode(',', $str))->filter()->map(fn (string $string) => trim($string))->all();
    }
}

if (! function_exists('clamp')) {
    /**
     * Ensures provided value does not exceed min and max values.
     *
     * @param int|float $value
     * @param int|float $min
     * @param int|float $max
     *
     * @return int|float
     */
    function clamp(int|float $value, int|float $min, int|float $max): int|float
    {
        return max(
            $min,
            min($max, $value)
        );
    }
}

if (! function_exists('random_serial_number')) {
    /**
     * Generates a reliably unique random serial number.
     *
     * @param int $length
     *
     * @return string
     */
    function random_serial_number(int $length = 5): string
    {
        return now()->timestamp . '-' . strtoupper(Str::random($length));
    }
}

if (! function_exists('remove_excess_whitespace')) {
    /**
     * Removes excess whitespace from a given string.
     *
     * @param string $text
     * @param bool $trimOnEdges
     *
     * @return string
     */
    function remove_excess_whitespace(string $text, bool $trimOnEdges = false): string
    {
        $text = preg_replace('/\s+/', ' ', $text);

        if (! $trimOnEdges) {
            return $text;
        }

        return trim($text);
    }
}

if (! function_exists('json_decode_as_force_object')) {
    /**
     * Transforms a given value to a JSON forced object.
     *
     * @param mixed $json
     * @param bool|null $associative
     *
     * @return string
     */
    function json_decode_as_force_object(mixed $json, ?bool $associative = null): mixed
    {
        return json_decode(json_encode($json, JSON_FORCE_OBJECT), $associative);
    }
}

if (! function_exists('empty_resource_to_object')) {
    /**
     * Returns empty object if resource is empty.
     *
     * @param JsonResource $resource
     *
     * @return string|JsonResource|stdClass
     */
    function empty_resource_to_object(JsonResource $resource): string|JsonResource|stdClass
    {
        if (empty(json_decode(json_encode($resource)))) {
            return new \stdClass;
        }

        return $resource;
    }
}

if (! function_exists('repeat')) {
    /**
     * Generates a shortened day name from given date.
     *
     * @param mixed $value
     * @param int $repeating
     * @return array
     */
    function repeat(mixed $value, int $repeating = 2): array
    {
        $repeatedValues = [];

        foreach (range(1, $repeating) as $_) {
            $repeatedValues[] = $value;
        }

        return $repeatedValues;
    }
}

if (! function_exists('normalize_name')) {
    /**
     * Generates a shortened day name from given date.
     *
     * @param string|null $string
     * @return string
     */
    function normalize_name(?string $string): string
    {
        return ucwords(trim($string ?? ''));
    }
}

if (! function_exists('signed_file_url')) {
    /**
     * Relativan potpisan link ka privatnom fajlu (slika, video, PDF), vazi
     * config('sparkylink.signed_url_minutes') minuta. Relativan, da radi isto na
     * localhost-u, IP adresi racunara i produkcionom domenu iza proxy-ja.
     *
     * @param array<string, mixed> $parameters
     */
    function signed_file_url(string $route, array $parameters = []): string
    {
        return \Illuminate\Support\Facades\URL::temporarySignedRoute(
            $route,
            now()->addMinutes((int) config('sparkylink.signed_url_minutes')),
            $parameters,
            absolute: false
        );
    }
}

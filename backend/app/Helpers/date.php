<?php

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Carbon\Exceptions\InvalidFormatException;

if (! function_exists('all_available_timezones')) {
    /**
     * List of all available timezones.
     *
     * @return array
     */
    function all_available_timezones(): array
    {
        return DateTimeZone::listIdentifiers();
    }
}

if (! function_exists('date_from')) {
    /**
     * Formats date from request to be used for querying.
     *
     * @param string|null $format
     * @param string $date
     *
     * @return CarbonInterface|null
     */
    function date_from(?string $format = null, string $date = 'date_from'): ?CarbonInterface
    {
        if (request()->has($date)) {
            return request()->date($date, $format)?->startOfDay();
        }

        try {
            return Carbon::createFromFormat($format, $date)->startOfDay();
        } catch (InvalidFormatException) {
            return null;
        }
    }
}

if (! function_exists('date_to')) {
    /**
     * Formats date from request to be used for querying.
     *
     * @param string|null $format
     * @param string $date
     * @param bool $now
     *
     * @return CarbonInterface|null
     */
    function date_to(?string $format = null, string $date = 'date_to', bool $now = false): ?CarbonInterface
    {
        if (request()->has($date) || $now) {
            return (request()->date($date, $format) ?: now())->endOfDay();
        }

        try {
            return Carbon::createFromFormat($format, $date)->endOfDay();
        } catch (InvalidFormatException) {
            return null;
        }
    }
}

if (! function_exists('maximum_date')) {
    /**
     * Formats date from request to be used for querying or returns maximum date if null is provided.
     *
     * @param string|null $format
     * @param string $requestKey
     *
     * @return CarbonInterface
     */
    function maximum_date(?string $format = null, string $requestKey = 'date_to'): CarbonInterface
    {
        $date = request()->date($requestKey, $format);

        if ($date) {
            return $date->endOfDay();
        }

        return Carbon::create(9999, 12, 31, 23, 59, 59);
    }
}

if (! function_exists('convert_to_client_timezone')) {
    /**
     * Converts date to client timezone.
     *
     * @param Carbon $date
     *
     * @return string
     */
    function convert_to_client_timezone(Carbon $date): string
    {
        $clientTimezone = config('app.client_timezone', 'UTC');

        return $date->timezone($clientTimezone)
                    ->toISOString(true);
    }
}

if (! function_exists('try_to_parse_date')) {
    /**
     * Attempts to format date from request to be used for querying and returns null on failure.
     *
     * @param string $date
     *
     * @return CarbonInterface|null
     */
    function try_to_parse_date(string $date): ?CarbonInterface
    {
        try {
            return Carbon::parse($date);
        } catch (InvalidFormatException) {
            return Carbon::parse(null);
        }

    }
}

if (! function_exists('carbon_diff_for_humans')) {
    /**
     * Returns diff between two dates in human readable format.
     *
     * @param CarbonInterface $firstDate
     * @param CarbonInterface|null $secondDate
     * @param int $parts
     *
     * @return string
     */
    function carbon_diff_for_humans(
        CarbonInterface $firstDate,
        ?CarbonInterface $secondDate = null,
        int             $parts = 2
    ): string
    {
        $secondDate ??= Carbon::now();

        $diff = $firstDate->diff($secondDate);

        $diffParts = [];

        if ($diff->y > 0) {
            $diffParts[] = "{$diff->y}y";
        }

        if ($diff->m > 0) {
            $diffParts[] = "{$diff->m}m";
        }

        if ($diff->d > 0) {
            $diffParts[] = "{$diff->d}d";
        }

        if ($diff->h > 0) {
            $diffParts[] = "{$diff->h}h";
        }

        if ($diff->i > 0) {
            $diffParts[] = "{$diff->i}min";
        }

        if ($diff->s > 0) {
            $diffParts[] = "{$diff->s}s";
        }

        return implode(' ', array_slice($diffParts, 0, $parts));
    }
}

if (! function_exists('day_name')) {
    /**
     * Generates a shortened day name from given date.
     *
     * @param CarbonInterface $date
     *
     * @return string
     */
    function day_name(CarbonInterface $date): string
    {
        return strtolower($date->format('D'));
    }
}

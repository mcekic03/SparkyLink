<?php

if (! function_exists('str_icontains')) {
    /**
     * Performs case-insensitive str_contains function.
     *
     * @param string $haystack
     * @param string|null $needle
     *
     * @return bool
     */
    function str_icontains(string $haystack, ?string $needle): bool
    {
        if (is_null($needle)) {
            $needle = '';
        }

        return str_contains(strtolower($haystack), strtolower($needle));
    }
}

if (! function_exists('contains_unique')) {
    /**
     * Check whether array contains unique values.
     *
     * @param array $array
     *
     * @return bool
     */
    function contains_unique_values(array $array): bool
    {
        return count($array) === count(array_unique($array));
    }
}

if (! function_exists('is_between')) {
    /**
     * Checks whether number is between min and max values.
     *
     * @param int|float $value
     * @param int|float $min
     * @param int|float $max
     *
     * @return int|float
     */
    function is_between(int|float $value, int|float $min, int|float $max): int|float
    {
        return $value >= $min && $value <= $max;
    }
}

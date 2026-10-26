<?php

if (! function_exists('express_as_percentages')) {
    /**
     * Expresses given values as percentages.
     *
     * @param array $data
     * @param bool $rounded
     *
     * @return array
     */
    function express_as_percentages(array $data, bool $rounded = false): array
    {
        $total = array_sum($data);

        return array_map(
            fn ($item) => ratio($item, $total, asPercentage: true),
            $data
        );
    }
}

if (! function_exists('ratio')) {
    /**
     * Calculate a ratio of given values;
     *
     * @param int|float $num1
     * @param int|float $num2
     * @param bool $asPercentage
     * @param bool $rounded
     *
     * @return float
     */
    function ratio(int|float $num1, int|float $num2, bool $asPercentage = false, bool $rounded = false): float
    {
        $ratio = $num2 != 0
            ? ($num1 / $num2) * ($asPercentage ? 100 : 1)
            : 0;

        return $rounded
            ? round($ratio)
            : floatval(number_format($ratio, 2));
    }
}

if (! function_exists('to_percentage')) {
    /**
     * Formats multiplier as percentage.
     *
     * @param float $multiplier
     *
     * @return string
     */
    function to_percentage(float $multiplier): string
    {
        return (($multiplier - 1) * 100) . '%';
    }
}

if (! function_exists('from_percentage')) {
    /**
     * Formats percentage to multiplier.
     *
     * @param string $percentage
     *
     * @return string
     */
    function from_percentage(string $percentage): string
    {
        $percentage = (float) trim(
            trim($percentage),
            '%'
        );

        return $percentage / 100 + 1;
    }
}

if (! function_exists('str_to_bool')) {
    /**
     * Converts string to boolean value.
     *
     * @param string $str
     *
     * @return bool
     */
    function str_to_bool(string $str): bool
    {
        return match ($str) {
            'on' => true,
            'off' => false,
        };
    }
}

if (! function_exists('bool_to_str')) {
    /**
     * Converts boolean to string value
     *
     * @param bool $bool
     *
     * @return string
     */
    function bool_to_str(bool $bool): string
    {
        return match ($bool) {
            true => 'on',
            false => 'off',
        };
    }
}

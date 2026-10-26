<?php

namespace App\Casts;

use Illuminate\Contracts\Database\Eloquent\CastsAttributes;

class RoundNumber implements CastsAttributes
{
    public function __construct(public int $precision) {}

    public function get($model, string $key, $value, array $attributes)
    {
        return round($value, $this->precision);
    }

    public function set($model, string $key, $value, array $attributes)
    {
        return $value;
    }
}

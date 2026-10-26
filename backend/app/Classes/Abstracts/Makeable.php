<?php

namespace App\Classes\Abstracts;

abstract class Makeable
{
    public static function make(...$parameters): static
    {
        return new static(...func_get_args());
    }
}

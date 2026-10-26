<?php

namespace App\Traits\Core;

trait AsAction
{
    /**
     * @return static
     */
    public static function make(): static
    {
        return app(static::class);
    }
}

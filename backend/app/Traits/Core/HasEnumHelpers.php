<?php

namespace App\Traits\Core;

trait HasEnumHelpers
{
    public function is(mixed $self): bool
    {
        return $this === $self;
    }

    public function isAny(...$selves): bool
    {
        $selves = collect($selves)->flatten()->toArray();

        return in_array($this, $selves, strict: true);
    }

    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

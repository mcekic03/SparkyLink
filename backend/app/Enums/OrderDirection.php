<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

enum OrderDirection: string
{
    use HasEnumHelpers;

    case ASC = 'asc';

    case DESC = 'desc';

    public static function fromValue(?string $value): self
    {
        if (! $value) {
            return self::DESC;
        }

        return match (strtolower($value)) {
            'asc' => self::ASC,
            default => self::DESC,
        };
    }
}

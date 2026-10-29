<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

/**
 * Nazivna struja osiguraca; vrednost je broj ampera.
 */
enum FuseRating: int
{
    use HasEnumHelpers;

    case A6 = 6;

    case A10 = 10;

    case A16 = 16;

    case A20 = 20;

    case A25 = 25;

    case A32 = 32;
}

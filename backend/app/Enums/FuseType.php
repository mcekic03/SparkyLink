<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

/**
 * Karakteristika automatskog osiguraca.
 */
enum FuseType: int
{
    use HasEnumHelpers;

    // Opsta namena: rasveta, uticnice, bojler.
    case B = 1;

    // Potrosaci sa vecom polaznom strujom: motori, pumpe, klima uredjaji.
    case C = 2;

    public function label(): string
    {
        return $this->name;
    }
}

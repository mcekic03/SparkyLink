<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

enum ExchangeRateSource: int
{
    use HasEnumHelpers;

    case API = 1;

    case MANUAL = 2;
}

<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

enum TimeUnit: string
{
    use HasEnumHelpers;

    case DAY = 'DAY';

    case HOUR = 'HOUR';

    case MINUTE = 'MINUTE';

    case SECOND = 'SECOND';
}

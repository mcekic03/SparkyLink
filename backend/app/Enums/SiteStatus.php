<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

/**
 * Status radova na gradilistu. Status naplate je poseban i racuna se iz uplata (PaymentStatus).
 */
enum SiteStatus: int
{
    use HasEnumHelpers;

    // Napravljena ponuda, ceka se odgovor investitora.
    case OFFER = 1;

    case OPEN = 2;

    case CLOSED = 3;

    public function label(): string
    {
        return match ($this) {
            SiteStatus::OFFER => __('site_status_offer'),
            SiteStatus::OPEN => __('site_status_open'),
            SiteStatus::CLOSED => __('site_status_closed'),
        };
    }
}

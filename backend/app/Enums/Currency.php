<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

enum Currency: int
{
    use HasEnumHelpers;

    case RSD = 1;

    case EUR = 2;

    public function code(): string
    {
        return match ($this) {
            Currency::RSD => 'RSD',
            Currency::EUR => 'EUR',
        };
    }

    public function symbol(): string
    {
        return match ($this) {
            Currency::RSD => 'din',
            Currency::EUR => '€',
        };
    }

    public function label(): string
    {
        return match ($this) {
            Currency::RSD => __('currency_rsd'),
            Currency::EUR => __('currency_eur'),
        };
    }

    public function other(): self
    {
        return $this === Currency::RSD ? Currency::EUR : Currency::RSD;
    }

    /**
     * Sufiks kolona sa iznosima (`sale_total_rsd`, `amount_eur`...).
     */
    public function column(): string
    {
        return strtolower($this->code());
    }
}

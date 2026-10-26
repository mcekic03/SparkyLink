<?php

namespace App\Enums;

use App\Classes\Utilities\Money;
use App\Traits\Core\HasEnumHelpers;
use Brick\Math\BigDecimal;

/**
 * Status naplate gradilista - ne upisuje se, racuna se iz naplate i uplata u valuti obracuna.
 */
enum PaymentStatus: int
{
    use HasEnumHelpers;

    case UNPAID = 1;

    case PARTIALLY_PAID = 2;

    case PAID = 3;

    public function label(): string
    {
        return match ($this) {
            PaymentStatus::UNPAID => __('payment_status_unpaid'),
            PaymentStatus::PARTIALLY_PAID => __('payment_status_partially_paid'),
            PaymentStatus::PAID => __('payment_status_paid'),
        };
    }

    public static function fromAmounts(string|int|float|null $billed, string|int|float|null $paid): self
    {
        $paid = BigDecimal::of(Money::normalize($paid ?? 0));

        if (! $paid->isPositive()) {
            return PaymentStatus::UNPAID;
        }

        $remaining = BigDecimal::of(Money::normalize($billed ?? 0))->minus($paid);

        return $remaining->isPositive() ? PaymentStatus::PARTIALLY_PAID : PaymentStatus::PAID;
    }
}

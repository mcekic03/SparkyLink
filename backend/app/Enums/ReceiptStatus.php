<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

enum ReceiptStatus: int
{
    use HasEnumHelpers;

    case PENDING = 1;

    case FETCHED = 2;

    case FAILED = 3;

    case MANUAL = 4;

    public function label(): string
    {
        return match ($this) {
            ReceiptStatus::PENDING => __('receipt_status_pending'),
            ReceiptStatus::FETCHED => __('receipt_status_fetched'),
            ReceiptStatus::FAILED => __('receipt_status_failed'),
            ReceiptStatus::MANUAL => __('receipt_status_manual'),
        };
    }

    public function canBeRefetched(): bool
    {
        return $this === ReceiptStatus::PENDING || $this === ReceiptStatus::FAILED;
    }
}

<?php

namespace App\Actions\Receipt\Admin;

use App\Contracts\FiscalReceiptFetcher;
use App\Enums\ReceiptStatus;
use App\Models\Receipt;
use App\Services\FiscalReceipts\ReceiptFetchException;
use App\Traits\Core\AsAction;

class RefetchReceiptAction
{
    use AsAction;

    public function __construct(
        private readonly FiscalReceiptFetcher $fetcher,
    ) {}

    /**
     * Ponovo preuzima racun koji ceka (ili je pao). Posle max_fetch_attempts neuspeha ostaje "greska".
     */
    public function handle(Receipt $receipt): Receipt
    {
        if (! $receipt->qr_url || ! $receipt->status->canBeRefetched()) {
            return $receipt;
        }

        try {
            $fetched = $this->fetcher->fetch($receipt->qr_url);

            $receipt->update([
                'status' => ReceiptStatus::FETCHED,
                'fetch_attempts' => $receipt->fetch_attempts + 1,
                ...StoreReceiptAction::detailsFrom($fetched),
            ]);
        } catch (ReceiptFetchException $exception) {
            $attempts = $receipt->fetch_attempts + 1;

            $receipt->update([
                'status' => $attempts >= (int) config('sparkylink.receipts.max_fetch_attempts')
                    ? ReceiptStatus::FAILED
                    : ReceiptStatus::PENDING,
                'fetch_attempts' => $attempts,
                'fetch_error' => $exception->getMessage(),
            ]);
        }

        return $receipt;
    }
}

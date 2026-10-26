<?php

namespace App\Contracts;

use App\Services\FiscalReceipts\FetchedReceipt;
use App\Services\FiscalReceipts\ReceiptFetchException;

/**
 * Preuzimanje fiskalnog racuna po linku sa QR koda. Iza ugovora je sajt Poreske uprave;
 * u testovima se zamenjuje laznim.
 */
interface FiscalReceiptFetcher
{
    /**
     * @throws ReceiptFetchException
     */
    public function fetch(string $url): FetchedReceipt;
}

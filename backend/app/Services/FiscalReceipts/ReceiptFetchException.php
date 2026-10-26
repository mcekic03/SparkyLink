<?php

namespace App\Services\FiscalReceipts;

use RuntimeException;

/**
 * Racun nije preuzet: sajt Poreske uprave ne odgovara ili je vratio nesto sto ne umemo da procitamo.
 */
class ReceiptFetchException extends RuntimeException {}

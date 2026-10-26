<?php

namespace App\Console\Commands;

use App\Actions\Receipt\Admin\RefetchReceiptAction;
use App\Enums\ReceiptStatus;
use App\Models\Receipt;
use Illuminate\Console\Command;

class RetryPendingReceiptsCommand extends Command
{
    protected $signature = 'receipts:retry';

    protected $description = 'Ponovo preuzima fiskalne racune sacuvane dok sajt Poreske uprave nije odgovarao';

    public function handle(RefetchReceiptAction $refetchReceiptAction): int
    {
        $receipts = Receipt::query()
                           ->where('status', ReceiptStatus::PENDING)
                           ->whereNotNull('qr_url')
                           ->orderBy('id')
                           ->limit(50)
                           ->get();

        foreach ($receipts as $receipt) {
            $refetchReceiptAction->handle($receipt);
            $this->line("Racun #{$receipt->id}: {$receipt->status->label()}");
        }

        return self::SUCCESS;
    }
}

<?php

namespace App\Actions\Receipt\Admin;

use App\Models\Receipt;
use App\Traits\Core\AsAction;
use Illuminate\Support\Facades\DB;

class DeleteReceiptAction
{
    use AsAction;

    /**
     * Brise racun i stavke koje su sa njega uvezene (racun unet greskom ne sme da ostavi materijal).
     */
    public function handle(Receipt $receipt): void
    {
        DB::transaction(function () use ($receipt) {
            $receipt->items()->delete();
            $receipt->delete();
        });
    }
}

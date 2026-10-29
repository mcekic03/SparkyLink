<?php

use App\Enums\FuseBoardTemplate;
use App\Http\Controllers\FileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Javne rute (bez tokena)
|--------------------------------------------------------------------------
|
| Privatni fajlovi idu preko relativnih potpisanih linkova koje API resursi
| daju prijavljenom korisniku (vaze config('sparkylink.signed_url_minutes')).
| Logo firme je javan (stranica za prijavu, PWA).
|
*/

Route::get('files/logo', [FileController::class, 'logo'])->name('files.logo');

Route::middleware('signed:relative')->prefix('files')->as('files.')->group(function () {
    Route::get('media/{media}/{variant?}', [FileController::class, 'media'])->whereIn('variant', ['thumb'])->name('media');
    Route::get('receipts/{receipt}/photo', [FileController::class, 'receiptPhoto'])->name('receipts.photo');
    Route::get('receipts/{receipt}/copy', [FileController::class, 'receiptCopy'])->name('receipts.copy');
    Route::get('documents/{document}', [FileController::class, 'document'])->name('documents');
    Route::get('fuse-boards/{fuseBoard}/{template}', [FileController::class, 'fuseBoard'])
         ->whereIn('template', FuseBoardTemplate::values())
         ->name('fuse-boards');
});

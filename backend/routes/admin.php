<?php

use App\Http\Controllers\ActivityLogController;
use App\Http\Controllers\Dashboard\Admin\DashboardController;
use App\Http\Controllers\Document\Admin\DocumentController;
use App\Http\Controllers\ExchangeRate\Admin\ExchangeRateController;
use App\Http\Controllers\FuseBoard\Admin\FuseBoardController;
use App\Http\Controllers\LaborEntry\Admin\LaborEntryController;
use App\Http\Controllers\Payment\Admin\PaymentController;
use App\Http\Controllers\PriceList\Admin\PriceListItemController;
use App\Http\Controllers\Receipt\Admin\ReceiptController;
use App\Http\Controllers\Setting\Admin\SettingController;
use App\Http\Controllers\Site\Admin\SiteController;
use App\Http\Controllers\SiteItem\Admin\SiteItemController;
use App\Http\Controllers\SiteMedia\Admin\SiteMediaController;
use App\Http\Controllers\SiteNote\Admin\SiteNoteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes (prefiks /api/admin, auth:sanctum)
|--------------------------------------------------------------------------
|
| Sistem ima jedan nalog (vlasnik), pa prijavljen korisnik sme sve; nema uloga
| ni upravljanja korisnicima.
|
*/

/** Auth Routes */
require __DIR__ . '/auth.php';

Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

Route::get('sites', [SiteController::class, 'index'])->name('sites.index');
Route::post('sites', [SiteController::class, 'store'])->name('sites.store');
Route::get('sites/{site}', [SiteController::class, 'show'])->whereNumber('site')->name('sites.show');
Route::put('sites/{site}', [SiteController::class, 'update'])->name('sites.update');
Route::delete('sites/{site}', [SiteController::class, 'destroy'])->name('sites.destroy');
Route::post('sites/{site}/restore', [SiteController::class, 'restore'])->whereNumber('site')->name('sites.restore');
Route::get('sites/{site}/summary', [SiteController::class, 'summary'])->whereNumber('site')->name('sites.summary');

Route::apiResource('sites.items', SiteItemController::class)->shallow()->except(['show']);
Route::post('sites/{site}/items/spreadsheets', [SiteItemController::class, 'previewSpreadsheets'])->name('sites.items.spreadsheets');
Route::post('sites/{site}/items/import', [SiteItemController::class, 'import'])->name('sites.items.import');
Route::post('sites/{site}/items/purchase-prices', [SiteItemController::class, 'setPurchasePrices'])->name('sites.items.purchase-prices');
Route::apiResource('sites.labor-entries', LaborEntryController::class)->shallow()->except(['show']);
Route::apiResource('sites.payments', PaymentController::class)->shallow()->except(['show']);
Route::apiResource('sites.documents', DocumentController::class)->shallow()->only(['index', 'store', 'destroy']);
Route::apiResource('sites.fuse-boards', FuseBoardController::class)->shallow()->except(['show']);
Route::apiResource('sites.notes', SiteNoteController::class)->shallow()->except(['show']);
Route::apiResource('sites.media', SiteMediaController::class)->shallow()->parameters(['media' => 'media'])->except(['show']);

Route::get('sites/{site}/receipts', [ReceiptController::class, 'siteIndex'])->whereNumber('site')->name('sites.receipts.index');
Route::post('sites/{site}/receipts/preview', [ReceiptController::class, 'preview'])->name('sites.receipts.preview');
Route::post('sites/{site}/receipts', [ReceiptController::class, 'store'])->name('sites.receipts.store');
Route::get('receipts', [ReceiptController::class, 'index'])->name('receipts.index');
Route::get('receipts/{receipt}', [ReceiptController::class, 'show'])->name('receipts.show');
Route::post('receipts/{receipt}/refetch', [ReceiptController::class, 'refetch'])->name('receipts.refetch');
Route::post('receipts/{receipt}/items', [ReceiptController::class, 'importItems'])->name('receipts.items.store');
Route::delete('receipts/{receipt}', [ReceiptController::class, 'destroy'])->name('receipts.destroy');

Route::get('item-suggestions', [PriceListItemController::class, 'suggestions'])->name('item-suggestions');
Route::apiResource('price-list-items', PriceListItemController::class)->except(['show']);

Route::get('exchange-rates', [ExchangeRateController::class, 'index'])->name('exchange-rates.index');
Route::get('exchange-rates/{date}', [ExchangeRateController::class, 'show'])->name('exchange-rates.show');
Route::post('exchange-rates', [ExchangeRateController::class, 'store'])->name('exchange-rates.store');

Route::get('settings', [SettingController::class, 'show'])->name('settings.show');
Route::put('settings', [SettingController::class, 'update'])->name('settings.update');
Route::post('settings/logo', [SettingController::class, 'logo'])->name('settings.logo');

Route::apiResource('activity-logs', ActivityLogController::class)->only(['index', 'show']);

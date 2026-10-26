<?php

use App\Http\Controllers\Auth\Admin\AuthController;
use App\Http\Controllers\Auth\Admin\PasswordResetController;
use App\Http\Controllers\User\Admin\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Auth
|--------------------------------------------------------------------------
|
| Admin panel Auth based routes should live here.
|
*/

/**
 *  ======= UNPROTECTED ROUTES =======
 */

// Auth & password reset routes
Route::middleware(['guest', 'throttle:authentication'])
     ->withoutMiddleware('auth:sanctum')
     ->group(function () {
         Route::post('login', [AuthController::class, 'login'])->name('login');
         Route::post('forgot-password', [PasswordResetController::class, 'request'])->name('password.request');
         Route::post('reset-password', [PasswordResetController::class, 'reset'])->name('password.reset');
     });
Route::post('logout', [AuthController::class, 'logout'])->name('logout');
Route::post('refresh', [AuthController::class, 'refresh'])->name('refresh');

/**
 * ======= AUTH PROTECTED ROUTES =======
 */

// User profiles routes
// Chain ->destroyable() to enable profile deletion
Route::apiSingleton('user/profile-information', ProfileController::class);

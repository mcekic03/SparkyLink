<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web
|--------------------------------------------------------------------------
|
| SPA (React) servira sparky-web (nginx); backend odgovara samo na /api i /up.
|
*/

Route::get('/', fn () => response()->json(['name' => config('app.name')]));

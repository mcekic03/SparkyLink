<?php

namespace App\Providers;

use App\Classes\Macros;
use App\Contracts\FiscalReceiptFetcher;
use App\Models\PersonalAccessToken;
use App\Services\FiscalReceipts\PursFiscalReceiptFetcher;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Fiskalni racuni se citaju sa sajta Poreske uprave; testovi ga zamenjuju laznim.
        $this->app->bind(FiscalReceiptFetcher::class, PursFiscalReceiptFetcher::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Development helpers(constraints)
        Model::shouldBeStrict(! $this->app->isProduction());

        // Production protection
        DB::prohibitDestructiveCommands($this->app->isProduction());

        JsonResource::withoutWrapping();

        // This is disabling update of last_used_at column at every authenticated request
        Sanctum::usePersonalAccessTokenModel(PersonalAccessToken::class);

        Lang::handleMissingKeysUsing(function ($key, $replace, $locale, $fallback) {
            Log::channel('missing_translations')->error("Missing translation for key: $key in locale: {$locale}");
        });

        // Set up custom macros
        if (config('app.key')) {
            Macros::initialize();
        }

        // Generate the CSP nonce for Vite
        Vite::useCspNonce();
        Vite::usePreloadTagAttributes(false);
    }
}

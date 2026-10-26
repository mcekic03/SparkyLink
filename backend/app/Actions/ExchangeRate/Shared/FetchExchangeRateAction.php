<?php

namespace App\Actions\ExchangeRate\Shared;

use App\Enums\Currency;
use App\Enums\ExchangeRateSource;
use App\Models\ExchangeRate;
use App\Traits\Core\AsAction;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FetchExchangeRateAction
{
    use AsAction;

    /**
     * Preuzima srednji kurs evra (NBS) za dan i cuva ga. Rucno upisan kurs se ne gazi.
     * Vraca null kad servis ne odgovara ili vrati neispravan kurs.
     */
    public function handle(string $day): ?ExchangeRate
    {
        $date = Carbon::createFromFormat('!Y-m-d', $day);

        $existing = ExchangeRate::query()
                                ->where('currency', Currency::EUR)
                                ->where('effective_at', $date)
                                ->first();

        if ($existing?->source === ExchangeRateSource::MANUAL) {
            return $existing;
        }

        $url = str_replace('{date}', $day, (string) config('sparkylink.exchange_rate.url'));

        try {
            $response = Http::timeout((int) config('sparkylink.exchange_rate.timeout'))->acceptJson()->get($url);
        } catch (ConnectionException $exception) {
            Log::warning('Kurs nije preuzet: servis ne odgovara.', ['day' => $day, 'error' => $exception->getMessage()]);

            return null;
        }

        $rate = $response->successful() ? $response->json('exchange_middle') : null;

        if (! is_numeric($rate) || (float) $rate <= 0) {
            Log::warning('Kurs nije preuzet: neispravan odgovor.', ['day' => $day, 'status' => $response->status()]);

            return null;
        }

        return ExchangeRate::query()->updateOrCreate(
            ['currency' => Currency::EUR, 'effective_at' => $date],
            ['rate' => number_format((float) $rate, 4, '.', ''), 'source' => ExchangeRateSource::API]
        );
    }
}

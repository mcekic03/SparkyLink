<?php

namespace App\Actions\ExchangeRate\Shared;

use App\Enums\Currency;
use App\Models\ExchangeRate;
use App\Traits\Core\AsAction;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class ResolveExchangeRateAction
{
    use AsAction;

    // Koliko dana unazad sme da se uzme poslednji poznat kurs kad servis ne odgovara.
    private const FALLBACK_DAYS = 10;

    public function __construct(
        private readonly FetchExchangeRateAction $fetchExchangeRateAction,
    ) {}

    /**
     * Srednji kurs evra (dinara za 1 €) za dan stavke. Za buduci dan vazi danasnji kurs;
     * za vikend/praznik servis vraca poslednji objavljen. Kad kursa nema - greska na polju
     * `exchange_rate`, korisnik ga upisuje rucno.
     *
     * @throws ValidationException
     */
    public function handle(string $day): string
    {
        $rate = $this->tryHandle($day);

        if ($rate === null) {
            throw ValidationException::withMessages([
                'exchange_rate' => __('exchange_rate_unavailable', [
                    'date' => Carbon::createFromFormat('!Y-m-d', $this->effectiveDay($day))->format('d.m.Y.'),
                ]),
            ]);
        }

        return $rate;
    }

    public function tryHandle(string $day): ?string
    {
        $day = $this->effectiveDay($day);
        $date = Carbon::createFromFormat('!Y-m-d', $day);

        $stored = ExchangeRate::query()
                              ->where('currency', Currency::EUR)
                              ->where('effective_at', $date)
                              ->value('rate');

        if ($stored !== null) {
            return (string) $stored;
        }

        $fetched = $this->fetchExchangeRateAction->handle($day);

        if ($fetched) {
            return (string) $fetched->rate;
        }

        $fallback = ExchangeRate::query()
                                ->where('currency', Currency::EUR)
                                ->where('effective_at', '<', $date)
                                ->where('effective_at', '>=', $date->copy()->subDays(self::FALLBACK_DAYS))
                                ->orderByDesc('effective_at')
                                ->value('rate');

        return $fallback === null ? null : (string) $fallback;
    }

    private function effectiveDay(string $day): string
    {
        $today = now('Europe/Belgrade')->toDateString();

        return $day > $today ? $today : $day;
    }
}

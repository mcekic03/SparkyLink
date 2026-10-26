<?php

namespace App\Actions\LaborEntry\Admin;

use App\Actions\ExchangeRate\Shared\ResolveExchangeRateAction;
use App\Classes\Utilities\Money;
use App\Enums\Currency;
use App\Models\LaborEntry;
use App\Models\Site;
use App\Traits\Core\AsAction;

class SaveLaborEntryAction
{
    use AsAction;

    public function __construct(
        private readonly ResolveExchangeRateAction $resolveExchangeRateAction,
    ) {}

    /**
     * Trosak dana = broj radnika x sati x cena sata, u obe valute po kursu tog dana.
     *
     * @param array<string, mixed> $data validirani podaci (LaborEntryRequest)
     */
    public function handle(Site $site, array $data, ?LaborEntry $entry = null): LaborEntry
    {
        $currency = Currency::from((int) $data['currency']);
        $day = (string) $data['worked_at'];
        $rate = isset($data['exchange_rate']) && $data['exchange_rate'] !== null
            ? (string) $data['exchange_rate']
            : $this->resolveExchangeRateAction->handle($day);

        $personHours = Money::lineTotal((int) $data['workers_count'], (string) $data['hours']);
        $totals = Money::toBoth(Money::lineTotal($personHours, (string) $data['hourly_rate']), $currency, $rate);

        $entry ??= new LaborEntry(['site_id' => $site->id, 'created_by' => auth()->id()]);

        $entry->fill([
            'currency' => $currency,
            'workers_count' => (int) $data['workers_count'],
            'hours' => (string) $data['hours'],
            'hourly_rate' => (string) $data['hourly_rate'],
            'exchange_rate' => $rate,
            'total_rsd' => $totals['rsd'],
            'total_eur' => $totals['eur'],
            'description' => $data['description'] ?? null,
            'worked_at' => $day,
        ])->save();

        return $entry;
    }
}

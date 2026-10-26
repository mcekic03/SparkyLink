<?php

namespace App\Actions\Dashboard\Admin;

use App\Actions\ExchangeRate\Shared\ResolveExchangeRateAction;
use App\Classes\Utilities\Money;
use App\Classes\Utilities\SiteFinancials;
use App\Enums\Currency;
use App\Enums\SiteStatus;
use App\Models\LaborEntry;
use App\Models\Payment;
use App\Models\Site;
use App\Models\SiteItem;
use App\Traits\Core\AsAction;
use Closure;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class BuildDashboardAction
{
    use AsAction;

    private const BILLED_RSD = 'SUM(CASE WHEN is_billable = 1 THEN sale_total_rsd ELSE 0 END)';

    private const BILLED_EUR = 'SUM(CASE WHEN is_billable = 1 THEN sale_total_eur ELSE 0 END)';

    /**
     * Ponude (gradilista koja investitor jos nije prihvatio) nisu ni naplata ni dug.
     */
    private static function realWork(): Closure
    {
        return fn (Builder $site) => $site->where('status', '!=', SiteStatus::OFFER);
    }

    public function __construct(
        private readonly ResolveExchangeRateAction $resolveExchangeRateAction,
    ) {}

    /**
     * Pregled za period (podrazumevano od 1. januara do danas): naplata, troskovi, zarada,
     * uplate; potrazivanja od investitora (ukupno, bez obzira na period); zarada po mesecima
     * (12 meseci do kraja perioda); najisplativija gradilista u periodu.
     *
     * @return array<string, mixed>
     */
    public function handle(?string $from = null, ?string $to = null): array
    {
        $today = now('Europe/Belgrade')->toDateString();
        $to ??= $today;
        $from ??= substr($to, 0, 4) . '-01-01';
        $fromAt = Carbon::createFromFormat('!Y-m-d', $from);
        $toAt = Carbon::createFromFormat('!Y-m-d', $to)->endOfDay();
        $todayRate = $this->resolveExchangeRateAction->tryHandle($today);

        $items = SiteItem::query()->whereHas('site', self::realWork())
                         ->whereBetween('occurred_at', [$fromAt, $toAt])
                         ->selectRaw(self::BILLED_RSD . ' AS billed_rsd, ' . self::BILLED_EUR . ' AS billed_eur')
                         ->selectRaw('SUM(purchase_total_rsd) AS cost_rsd, SUM(purchase_total_eur) AS cost_eur')
                         ->toBase()
                         ->first();

        $labor = LaborEntry::query()->whereHas('site', self::realWork())
                           ->whereBetween('worked_at', [$fromAt, $toAt])
                           ->selectRaw('SUM(total_rsd) AS rsd, SUM(total_eur) AS eur')
                           ->toBase()
                           ->first();

        $paid = Payment::query()->whereHas('site', self::realWork())
                       ->whereBetween('paid_at', [$fromAt, $toAt])
                       ->selectRaw('SUM(amount_rsd) AS rsd, SUM(amount_eur) AS eur')
                       ->toBase()
                       ->first();

        $billed = ['rsd' => Money::sum([$items?->billed_rsd]), 'eur' => Money::sum([$items?->billed_eur])];
        $costs = [
            'rsd' => Money::sum([$items?->cost_rsd, $labor?->rsd]),
            'eur' => Money::sum([$items?->cost_eur, $labor?->eur]),
        ];

        return [
            'period' => ['from' => $from, 'to' => $to],
            'exchange_rate_today' => $todayRate,
            'totals' => [
                'billed' => $billed,
                'costs' => $costs,
                'labor' => ['rsd' => Money::sum([$labor?->rsd]), 'eur' => Money::sum([$labor?->eur])],
                'profit' => [
                    'rsd' => Money::subtract($billed['rsd'], $costs['rsd']),
                    'eur' => Money::subtract($billed['eur'], $costs['eur']),
                ],
                'paid' => ['rsd' => Money::sum([$paid?->rsd]), 'eur' => Money::sum([$paid?->eur])],
            ],
            'sites_by_status' => $this->sitesByStatus(),
            ...$this->receivables($todayRate),
            'monthly' => $this->monthly($toAt),
            'top_sites' => $this->topSites($fromAt, $toAt),
        ];
    }

    /**
     * @return array<int, int>
     */
    private function sitesByStatus(): array
    {
        $counts = Site::query()->selectRaw('status, COUNT(*) AS total')->groupBy('status')->pluck('total', 'status');

        return collect(SiteStatus::cases())
            ->mapWithKeys(fn (SiteStatus $status) => [$status->value => (int) ($counts[$status->value] ?? 0)])
            ->all();
    }

    /**
     * Dug svih investitora: u valuti obracuna svakog gradilista, sabrano u obe valute po danasnjem kursu.
     *
     * @return array<string, mixed>
     */
    private function receivables(?string $todayRate): array
    {
        $debtors = Site::query()
                       ->where('status', '!=', SiteStatus::OFFER)
                       ->withFinancials()
                       ->get()
                       ->map(fn (Site $site) => ['site' => $site, 'financials' => SiteFinancials::fromSite($site)])
                       ->filter(fn (array $row) => Money::isPositive($row['financials']->balance()))
                       ->sortByDesc(fn (array $row) => (float) ($row['site']->currency === Currency::EUR
                           ? $row['financials']->balance()
                           : ($todayRate ? Money::convert($row['financials']->balance(), Currency::RSD, Currency::EUR, $todayRate) : 0)))
                       ->values();

        $total = ['rsd' => [], 'eur' => []];

        foreach ($debtors as $row) {
            $balance = $row['financials']->balance();
            $currency = $row['site']->currency;
            $total[$currency->column()][] = $balance;

            if ($todayRate) {
                $total[$currency->other()->column()][] = Money::convert($balance, $currency, $currency->other(), $todayRate);
            }
        }

        return [
            'receivables' => [
                'rsd' => Money::sum($total['rsd']),
                'eur' => Money::sum($total['eur']),
                'is_complete' => $todayRate !== null || $debtors->isEmpty(),
                'sites_count' => $debtors->count(),
            ],
            'debtors' => $debtors->take(10)->map(fn (array $row) => [
                'id' => $row['site']->id,
                'name' => $row['site']->name,
                'investor_name' => $row['site']->investor_name,
                'currency' => $row['site']->currency->value,
                'balance' => $row['financials']->balance(),
                'payment_status' => $row['financials']->paymentStatus()->value,
            ])->all(),
        ];
    }

    /**
     * Naplata, troskovi i zarada po mesecima (12 meseci zakljucno sa mesecom kraja perioda).
     *
     * @return array<int, array<string, mixed>>
     */
    private function monthly(Carbon $toAt): array
    {
        $start = $toAt->copy()->startOfMonth()->subMonths(11);

        $items = SiteItem::query()->whereHas('site', self::realWork())
                         ->whereBetween('occurred_at', [$start, $toAt])
                         ->selectRaw("DATE_FORMAT(occurred_at, '%Y-%m') AS month")
                         ->selectRaw(self::BILLED_RSD . ' AS billed_rsd, ' . self::BILLED_EUR . ' AS billed_eur')
                         ->selectRaw('SUM(purchase_total_rsd) AS cost_rsd, SUM(purchase_total_eur) AS cost_eur')
                         ->groupBy('month')
                         ->toBase()
                         ->get()
                         ->keyBy('month');

        $labor = LaborEntry::query()->whereHas('site', self::realWork())
                           ->whereBetween('worked_at', [$start, $toAt])
                           ->selectRaw("DATE_FORMAT(worked_at, '%Y-%m') AS month, SUM(total_rsd) AS rsd, SUM(total_eur) AS eur")
                           ->groupBy('month')
                           ->toBase()
                           ->get()
                           ->keyBy('month');

        $months = [];

        for ($cursor = $start->copy(); $cursor->lte($toAt); $cursor->addMonth()) {
            $key = $cursor->format('Y-m');
            $row = $items[$key] ?? null;
            $work = $labor[$key] ?? null;
            $billed = ['rsd' => Money::sum([$row?->billed_rsd]), 'eur' => Money::sum([$row?->billed_eur])];
            $costs = [
                'rsd' => Money::sum([$row?->cost_rsd, $work?->rsd]),
                'eur' => Money::sum([$row?->cost_eur, $work?->eur]),
            ];

            $months[] = [
                'month' => $key,
                'billed' => $billed,
                'costs' => $costs,
                'profit' => [
                    'rsd' => Money::subtract($billed['rsd'], $costs['rsd']),
                    'eur' => Money::subtract($billed['eur'], $costs['eur']),
                ],
            ];
        }

        return $months;
    }

    /**
     * Pet gradilista sa najvecom zaradom (u evrima) u periodu.
     *
     * @return array<int, array<string, mixed>>
     */
    private function topSites(Carbon $fromAt, Carbon $toAt): array
    {
        $items = SiteItem::query()->whereHas('site', self::realWork())
                         ->whereBetween('occurred_at', [$fromAt, $toAt])
                         ->selectRaw('site_id')
                         ->selectRaw(self::BILLED_RSD . ' AS billed_rsd, ' . self::BILLED_EUR . ' AS billed_eur')
                         ->selectRaw('SUM(purchase_total_rsd) AS cost_rsd, SUM(purchase_total_eur) AS cost_eur')
                         ->groupBy('site_id')
                         ->toBase()
                         ->get()
                         ->keyBy('site_id');

        $labor = LaborEntry::query()->whereHas('site', self::realWork())
                           ->whereBetween('worked_at', [$fromAt, $toAt])
                           ->selectRaw('site_id, SUM(total_rsd) AS rsd, SUM(total_eur) AS eur')
                           ->groupBy('site_id')
                           ->toBase()
                           ->get()
                           ->keyBy('site_id');

        /** @var Collection<int, array<string, mixed>> $rows */
        $rows = $items->keys()->merge($labor->keys())->unique()->map(function ($siteId) use ($items, $labor) {
            $row = $items[$siteId] ?? null;
            $work = $labor[$siteId] ?? null;

            return [
                'site_id' => (int) $siteId,
                'billed' => ['rsd' => Money::sum([$row?->billed_rsd]), 'eur' => Money::sum([$row?->billed_eur])],
                'profit' => [
                    'rsd' => Money::subtract(Money::sum([$row?->billed_rsd]), Money::sum([$row?->cost_rsd, $work?->rsd])),
                    'eur' => Money::subtract(Money::sum([$row?->billed_eur]), Money::sum([$row?->cost_eur, $work?->eur])),
                ],
            ];
        })->sortByDesc(fn (array $row) => (float) $row['profit']['eur'])->take(5)->values();

        $names = Site::query()->withTrashed()->whereIn('id', $rows->pluck('site_id'))->pluck('name', 'id');

        return $rows->map(fn (array $row) => [...$row, 'name' => $names[$row['site_id']] ?? '—'])->all();
    }
}

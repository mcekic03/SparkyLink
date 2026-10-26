<?php

namespace App\Actions\Site\Admin;

use App\Actions\ExchangeRate\Shared\ResolveExchangeRateAction;
use App\Classes\Utilities\Money;
use App\Classes\Utilities\SiteFinancials;
use App\Enums\ItemType;
use App\Models\Site;
use App\Traits\Core\AsAction;

class BuildSiteSummaryAction
{
    use AsAction;

    public function __construct(
        private readonly ResolveExchangeRateAction $resolveExchangeRateAction,
    ) {}

    /**
     * Pregled finansija gradilista: po vrsti stavki, rad, naplata, troskovi, zarada,
     * uplate i dug (u valuti obracuna, a u drugoj valuti po danasnjem kursu).
     *
     * @return array<string, mixed>
     */
    public function handle(Site $site): array
    {
        $byType = $site->items()
                       ->selectRaw('type, is_billable')
                       ->selectRaw('SUM(purchase_total_rsd) AS purchase_rsd, SUM(purchase_total_eur) AS purchase_eur')
                       ->selectRaw('SUM(sale_total_rsd) AS sale_rsd, SUM(sale_total_eur) AS sale_eur')
                       ->groupBy('type', 'is_billable')
                       ->toBase()
                       ->get();

        $labor = $site->laborEntries()
                      ->selectRaw('SUM(total_rsd) AS cost_rsd, SUM(total_eur) AS cost_eur, SUM(workers_count * hours) AS person_hours')
                      ->toBase()
                      ->first();

        $sum = function (ItemType $type, string $field, ?bool $billableOnly = null) use ($byType): array {
            $rows = $byType->filter(fn (object $row) => (int) $row->type === $type->value
                && ($billableOnly === null || (bool) $row->is_billable === $billableOnly));

            return [
                'rsd' => Money::sum($rows->pluck("{$field}_rsd")),
                'eur' => Money::sum($rows->pluck("{$field}_eur")),
            ];
        };

        $materialsPurchase = $sum(ItemType::MATERIAL, 'purchase');
        $materialsSale = $sum(ItemType::MATERIAL, 'sale', true);

        $site->loadSum(['items as billed_rsd' => fn ($q) => $q->where('is_billable', true)], 'sale_total_rsd')
             ->loadSum(['items as billed_eur' => fn ($q) => $q->where('is_billable', true)], 'sale_total_eur')
             ->loadSum('items as items_cost_rsd', 'purchase_total_rsd')
             ->loadSum('items as items_cost_eur', 'purchase_total_eur')
             ->loadSum('laborEntries as labor_cost_rsd', 'total_rsd')
             ->loadSum('laborEntries as labor_cost_eur', 'total_eur')
             ->loadSum('payments as paid_rsd', 'amount_rsd')
             ->loadSum('payments as paid_eur', 'amount_eur');

        $todayRate = $this->resolveExchangeRateAction->tryHandle(now('Europe/Belgrade')->toDateString());

        return [
            'currency' => $site->currency->value,
            'exchange_rate_today' => $todayRate,
            'materials' => [
                'purchase' => $materialsPurchase,
                'sale' => $materialsSale,
                'margin' => [
                    'rsd' => Money::subtract($materialsSale['rsd'], $materialsPurchase['rsd']),
                    'eur' => Money::subtract($materialsSale['eur'], $materialsPurchase['eur']),
                ],
            ],
            'services' => [
                'sale' => $sum(ItemType::SERVICE, 'sale', true),
            ],
            'other' => [
                'purchase' => $sum(ItemType::OTHER, 'purchase'),
                'sale' => $sum(ItemType::OTHER, 'sale', true),
            ],
            'labor' => [
                'cost' => ['rsd' => Money::sum([$labor?->cost_rsd]), 'eur' => Money::sum([$labor?->cost_eur])],
                'person_hours' => Money::sum([$labor?->person_hours]),
            ],
            // Nabavno za sve stavke (materijal i ostalo), bez rada; naplata svih stavki je `billed`.
            'items' => [
                'purchase' => ['rsd' => Money::sum([$site->items_cost_rsd]), 'eur' => Money::sum([$site->items_cost_eur])],
            ],
            ...SiteFinancials::fromSite($site)->toArray($todayRate),
        ];
    }
}

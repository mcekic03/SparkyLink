<?php

namespace App\Classes\Utilities;

use App\Enums\Currency;
use App\Enums\PaymentStatus;
use App\Models\Site;

/**
 * Finansije gradilista iz zbirova (Site::withFinancials()): naplata, troskovi, zarada,
 * uplate i dug u valuti obracuna. Svaki iznos je par ['rsd' => ..., 'eur' => ...].
 */
final class SiteFinancials
{
    /**
     * @param array{rsd: string, eur: string} $billed
     * @param array{rsd: string, eur: string} $costs
     * @param array{rsd: string, eur: string} $paid
     */
    public function __construct(
        public readonly Currency $currency,
        public readonly array $billed,
        public readonly array $costs,
        public readonly array $paid,
    ) {}

    public static function fromSite(Site $site): self
    {
        $attributes = $site->getAttributes();
        $value = fn (string $key): mixed => $attributes[$key] ?? 0;

        return new self(
            currency: $site->currency,
            billed: ['rsd' => Money::sum([$value('billed_rsd')]), 'eur' => Money::sum([$value('billed_eur')])],
            costs: [
                'rsd' => Money::sum([$value('items_cost_rsd'), $value('labor_cost_rsd')]),
                'eur' => Money::sum([$value('items_cost_eur'), $value('labor_cost_eur')]),
            ],
            paid: ['rsd' => Money::sum([$value('paid_rsd')]), 'eur' => Money::sum([$value('paid_eur')])],
        );
    }

    /**
     * @return array{rsd: string, eur: string}
     */
    public function profit(): array
    {
        return [
            'rsd' => Money::subtract($this->billed['rsd'], $this->costs['rsd']),
            'eur' => Money::subtract($this->billed['eur'], $this->costs['eur']),
        ];
    }

    /**
     * Preostali dug investitora u valuti obracuna (negativno = preplata).
     */
    public function balance(): string
    {
        $column = $this->currency->column();

        return Money::subtract($this->billed[$column], $this->paid[$column]);
    }

    public function paymentStatus(): PaymentStatus
    {
        $column = $this->currency->column();

        return PaymentStatus::fromAmounts($this->billed[$column], $this->paid[$column]);
    }

    /**
     * Dug preracunat u drugu valutu po danasnjem kursu (null kad kursa nema).
     */
    public function balanceInOtherCurrency(?string $todayRate): ?string
    {
        if ($todayRate === null) {
            return null;
        }

        return Money::convert($this->balance(), $this->currency, $this->currency->other(), $todayRate);
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(?string $todayRate = null): array
    {
        return [
            'billed' => $this->billed,
            'costs' => $this->costs,
            'profit' => $this->profit(),
            'paid' => $this->paid,
            'balance' => [
                'amount' => $this->balance(),
                'currency' => $this->currency->value,
                'other_amount' => $this->balanceInOtherCurrency($todayRate),
            ],
            'payment_status' => $this->paymentStatus()->value,
        ];
    }
}

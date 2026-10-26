<?php

namespace App\Actions\Payment\Admin;

use App\Actions\ExchangeRate\Shared\ResolveExchangeRateAction;
use App\Classes\Utilities\Money;
use App\Enums\Currency;
use App\Models\Payment;
use App\Models\Site;
use App\Traits\Core\AsAction;

class SavePaymentAction
{
    use AsAction;

    public function __construct(
        private readonly ResolveExchangeRateAction $resolveExchangeRateAction,
    ) {}

    /**
     * Uplata investitora u obe valute po kursu na dan uplate.
     *
     * @param array<string, mixed> $data validirani podaci (PaymentRequest)
     */
    public function handle(Site $site, array $data, ?Payment $payment = null): Payment
    {
        $currency = Currency::from((int) $data['currency']);
        $day = (string) $data['paid_at'];
        $rate = isset($data['exchange_rate']) && $data['exchange_rate'] !== null
            ? (string) $data['exchange_rate']
            : $this->resolveExchangeRateAction->handle($day);

        $amounts = Money::toBoth((string) $data['amount'], $currency, $rate);

        $payment ??= new Payment(['site_id' => $site->id, 'created_by' => auth()->id()]);

        $payment->fill([
            'currency' => $currency,
            'amount' => $currency === Currency::RSD ? $amounts['rsd'] : $amounts['eur'],
            'exchange_rate' => $rate,
            'amount_rsd' => $amounts['rsd'],
            'amount_eur' => $amounts['eur'],
            'note' => $data['note'] ?? null,
            'paid_at' => $day,
        ])->save();

        return $payment;
    }
}

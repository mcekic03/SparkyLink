<?php

namespace Database\Factories;

use App\Enums\Currency;
use App\Models\Payment;
use App\Models\Site;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'site_id' => Site::factory(),
            'currency' => Currency::EUR,
            'amount' => '100.00',
            'exchange_rate' => '117.0000',
            'amount_rsd' => '11700.00',
            'amount_eur' => '100.00',
            'paid_at' => now()->toDateString(),
        ];
    }
}

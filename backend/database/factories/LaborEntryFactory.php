<?php

namespace Database\Factories;

use App\Enums\Currency;
use App\Models\LaborEntry;
use App\Models\Site;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<LaborEntry>
 */
class LaborEntryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'site_id' => Site::factory(),
            'currency' => Currency::RSD,
            'workers_count' => 2,
            'hours' => '8.00',
            'hourly_rate' => '500.00',
            'exchange_rate' => '117.0000',
            'total_rsd' => '8000.00',
            'total_eur' => '68.38',
            'worked_at' => now()->toDateString(),
        ];
    }
}

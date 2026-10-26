<?php

namespace Database\Factories;

use App\Enums\Currency;
use App\Enums\SiteStatus;
use App\Models\Site;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Site>
 */
class SiteFactory extends Factory
{
    public function definition(): array
    {
        return [
            'status' => SiteStatus::OPEN,
            'currency' => Currency::EUR,
            'name' => 'Kuća ' . fake()->lastName(),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'investor_name' => fake()->name(),
            'investor_phone' => '+38164' . fake()->numerify('#######'),
            'started_at' => now()->subDays(10)->toDateString(),
        ];
    }

    public function rsd(): static
    {
        return $this->state(['currency' => Currency::RSD]);
    }
}

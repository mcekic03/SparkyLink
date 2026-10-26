<?php

namespace Database\Factories;

use App\Enums\Currency;
use App\Enums\ItemType;
use App\Models\Site;
use App\Models\SiteItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Stavka sa vec izracunatim iznosima (kurs 117.0000, cene u evrima).
 *
 * @extends Factory<SiteItem>
 */
class SiteItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'site_id' => Site::factory(),
            'type' => ItemType::MATERIAL,
            'currency' => Currency::EUR,
            'name' => 'Kabl PP-Y 3x2,5',
            'unit' => 'm',
            'quantity' => '10.000',
            'purchase_price' => '1.00',
            'sale_price' => '1.50',
            'exchange_rate' => '117.0000',
            'purchase_total_rsd' => '1170.00',
            'purchase_total_eur' => '10.00',
            'sale_total_rsd' => '1755.00',
            'sale_total_eur' => '15.00',
            'is_billable' => true,
            'occurred_at' => now()->toDateString(),
        ];
    }
}

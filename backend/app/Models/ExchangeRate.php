<?php

namespace App\Models;

use App\Enums\Currency;
use App\Enums\ExchangeRateSource;
use Eloquent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Srednji kurs NBS za dan (dinara za 1 jedinicu valute).
 *
 * @property int $id
 * @property Currency $currency
 * @property ExchangeRateSource $source
 * @property string $rate
 * @property Carbon $effective_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @mixin Eloquent
 */
class ExchangeRate extends Model
{
    // ===== 1. Properties =====

    protected $fillable = [
        'currency',
        'source',
        'rate',
        'effective_at',
    ];

    protected $casts = [
        'currency' => Currency::class,
        'source' => ExchangeRateSource::class,
        'rate' => 'decimal:4',
        'effective_at' => 'date:Y-m-d',
    ];
}

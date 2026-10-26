<?php

namespace App\Models;

use App\Enums\Currency;
use App\Enums\ItemType;
use App\Traits\Model\Filterable\Filterable;
use Eloquent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * Stavka cenovnika (usluga ili materijal sa uobicajenim cenama).
 *
 * @property int $id
 * @property ItemType $type
 * @property Currency $currency
 * @property string $name
 * @property string $unit
 * @property string|null $purchase_price
 * @property string|null $sale_price
 * @property bool $is_active
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @mixin Eloquent
 */
class PriceListItem extends Model
{
    use Filterable;

    // ===== 1. Properties =====

    protected $fillable = [
        'type',
        'currency',
        'name',
        'unit',
        'purchase_price',
        'sale_price',
        'is_active',
    ];

    protected $casts = [
        'type' => ItemType::class,
        'currency' => Currency::class,
        'purchase_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    // ===== 2. Scopes =====

    public function scopeFilters(Builder|self $query): Builder|self
    {
        return $query
            ->search(['name'])
            ->filterEnumFromRequest(ItemType::class, 'type')
            ->filterBoolFromRequest('is_active')
            ->sortFromRequest(onlyByFields: ['name', 'type', 'sale_price', 'created_at'])
            ->when(! request()->filled('sort'), fn (Builder $q) => $q->orderBy('name'));
    }
}

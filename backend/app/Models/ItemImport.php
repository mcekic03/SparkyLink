<?php

namespace App\Models;

use Eloquent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Jedan uvezen Excel fajl prodavnice; stavke iz njega se biraju zajedno (npr. za nabavnu cenu).
 *
 * @property int $id
 * @property int $site_id
 * @property int|null $created_by
 * @property string $file_name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @mixin Eloquent
 */
class ItemImport extends Model
{
    // ===== 1. Properties =====

    protected $fillable = [
        'site_id',
        'created_by',
        'file_name',
    ];

    // ===== 2. Relationships =====

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SiteItem::class);
    }
}

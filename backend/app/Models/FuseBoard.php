<?php

namespace App\Models;

use Eloquent;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * Tabla (ormar) na gradilistu sa rasporedom osiguraca.
 *
 * @property int $id
 * @property int $site_id
 * @property string $name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Site $site
 * @property-read Collection<int, Fuse> $fuses
 * @mixin Eloquent
 */
class FuseBoard extends Model
{
    // ===== 1. Properties =====

    protected $fillable = [
        'site_id',
        'name',
    ];

    // ===== 2. Relationships =====

    /**
     * I obrisano gradiliste, da raspored ostane dostupan.
     */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class)->withTrashed();
    }

    public function fuses(): HasMany
    {
        return $this->hasMany(Fuse::class)->orderBy('position');
    }
}

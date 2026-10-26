<?php

namespace App\Models;

use App\Enums\Currency;
use Database\Factories\LaborEntryFactory;
use Eloquent;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Dnevni trosak radnika: broj radnika x sati x cena sata. Investitor ga ne vidi.
 *
 * @property int $id
 * @property int $site_id
 * @property int|null $created_by
 * @property Currency $currency
 * @property int $workers_count
 * @property string $hours
 * @property string $hourly_rate
 * @property string $exchange_rate
 * @property string $total_rsd
 * @property string $total_eur
 * @property string|null $description
 * @property Carbon $worked_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @mixin Eloquent
 */
class LaborEntry extends Model
{
    /** @use HasFactory<LaborEntryFactory> */
    use HasFactory;

    // ===== 1. Properties =====

    protected $fillable = [
        'site_id',
        'created_by',
        'currency',
        'workers_count',
        'hours',
        'hourly_rate',
        'exchange_rate',
        'total_rsd',
        'total_eur',
        'description',
        'worked_at',
    ];

    protected $casts = [
        'currency' => Currency::class,
        'workers_count' => 'integer',
        'hours' => 'decimal:2',
        'hourly_rate' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'total_rsd' => 'decimal:2',
        'total_eur' => 'decimal:2',
        'worked_at' => 'date:Y-m-d',
    ];

    // ===== 2. Relationships =====

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

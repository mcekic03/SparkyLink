<?php

namespace App\Models;

use App\Enums\Currency;
use Database\Factories\PaymentFactory;
use Eloquent;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Uplata investitora (avans ili deo duga).
 *
 * @property int $id
 * @property int $site_id
 * @property int|null $created_by
 * @property Currency $currency
 * @property string $amount
 * @property string $exchange_rate
 * @property string $amount_rsd
 * @property string $amount_eur
 * @property string|null $note
 * @property Carbon $paid_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @mixin Eloquent
 */
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    // ===== 1. Properties =====

    protected $fillable = [
        'site_id',
        'created_by',
        'currency',
        'amount',
        'exchange_rate',
        'amount_rsd',
        'amount_eur',
        'note',
        'paid_at',
    ];

    protected $casts = [
        'currency' => Currency::class,
        'amount' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'amount_rsd' => 'decimal:2',
        'amount_eur' => 'decimal:2',
        'paid_at' => 'date:Y-m-d',
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

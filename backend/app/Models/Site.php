<?php

namespace App\Models;

use App\Enums\Currency;
use App\Enums\PaymentStatus;
use App\Enums\SiteStatus;
use App\Traits\Model\Filterable\Filterable;
use Database\Factories\SiteFactory;
use Eloquent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * Gradiliste (projekat) sa investitorom.
 *
 * @property int $id
 * @property int|null $created_by
 * @property SiteStatus $status
 * @property Currency $currency valuta obracuna sa investitorom
 * @property string $name
 * @property string|null $address
 * @property string|null $city
 * @property string|null $investor_name
 * @property string|null $investor_phone
 * @property string|null $investor_email
 * @property string|null $investor_address
 * @property string|null $description
 * @property string|null $markup_percent
 * @property Carbon|null $started_at
 * @property Carbon|null $completed_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 * @property-read User|null $creator
 * @mixin Eloquent
 */
class Site extends Model
{
    use Filterable;
    /** @use HasFactory<SiteFactory> */
    use HasFactory;
    use SoftDeletes;

    // ===== 1. Properties =====

    protected $fillable = [
        'created_by',
        'status',
        'currency',
        'name',
        'address',
        'city',
        'investor_name',
        'investor_phone',
        'investor_email',
        'investor_address',
        'description',
        'markup_percent',
        'started_at',
        'completed_at',
    ];

    protected $casts = [
        'status' => SiteStatus::class,
        'currency' => Currency::class,
        'markup_percent' => 'decimal:2',
        'started_at' => 'date:Y-m-d',
        'completed_at' => 'date:Y-m-d',
    ];

    protected $hidden = [
        'deleted_at',
    ];

    // ===== 2. Relationships =====

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SiteItem::class);
    }

    public function laborEntries(): HasMany
    {
        return $this->hasMany(LaborEntry::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function notes(): HasMany
    {
        return $this->hasMany(SiteNote::class);
    }

    public function media(): HasMany
    {
        return $this->hasMany(SiteMedia::class);
    }

    public function receipts(): HasMany
    {
        return $this->hasMany(Receipt::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    // ===== 3. Scopes =====

    public function scopeFilters(Builder|self $query): Builder|self
    {
        return $query
            ->search(['name', 'address', 'city', 'investor_name', 'investor_phone'])
            ->filterEnumFromRequest(SiteStatus::class, 'status')
            ->sortFromRequest(onlyByFields: ['name', 'status', 'started_at', 'completed_at', 'created_at'])
            ->initialSort();
    }

    /**
     * Zbirovi po valutama kao kolone upita: naplata, troskovi stavki, rad, uplate.
     */
    public function scopeWithFinancials(Builder|self $query): Builder|self
    {
        $billable = fn (Builder $items) => $items->where('is_billable', true);

        return $query
            ->withSum(['items as billed_rsd' => $billable], 'sale_total_rsd')
            ->withSum(['items as billed_eur' => $billable], 'sale_total_eur')
            ->withSum('items as items_cost_rsd', 'purchase_total_rsd')
            ->withSum('items as items_cost_eur', 'purchase_total_eur')
            ->withSum('laborEntries as labor_cost_rsd', 'total_rsd')
            ->withSum('laborEntries as labor_cost_eur', 'total_eur')
            ->withSum('payments as paid_rsd', 'amount_rsd')
            ->withSum('payments as paid_eur', 'amount_eur');
    }

    /**
     * Filter po statusu naplate (racuna se u valuti obracuna). Traži withFinancials().
     */
    public function scopeWherePaymentStatus(Builder|self $query, ?PaymentStatus $status): Builder|self
    {
        if (! $status) {
            return $query;
        }

        $billed = '(CASE WHEN sites.currency = ' . Currency::EUR->value . ' THEN COALESCE(billed_eur, 0) ELSE COALESCE(billed_rsd, 0) END)';
        $paid = '(CASE WHEN sites.currency = ' . Currency::EUR->value . ' THEN COALESCE(paid_eur, 0) ELSE COALESCE(paid_rsd, 0) END)';

        // Ponuda jos nema naplate, pa nema ni status naplate.
        $query->where('sites.status', '!=', SiteStatus::OFFER);

        return match ($status) {
            PaymentStatus::UNPAID => $query->havingRaw("{$paid} <= 0"),
            PaymentStatus::PARTIALLY_PAID => $query->havingRaw("{$paid} > 0 AND {$billed} - {$paid} > 0"),
            PaymentStatus::PAID => $query->havingRaw("{$paid} > 0 AND {$billed} - {$paid} <= 0"),
        };
    }

    // ===== 4. Helpers =====

    public function effectiveMarkupPercent(): string
    {
        return $this->markup_percent ?? Setting::defaultMarkupPercent();
    }
}

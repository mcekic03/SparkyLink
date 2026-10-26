<?php

namespace App\Models;

use App\Enums\ReceiptStatus;
use App\Traits\Model\Filterable\Filterable;
use Eloquent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * Fiskalni racun iz prodavnice (QR kod -> sajt Poreske uprave) ili slika racuna.
 * Cuva se uz gradiliste i kao dokaz za garanciju.
 *
 * @property int $id
 * @property int $site_id
 * @property int|null $created_by
 * @property ReceiptStatus $status
 * @property string|null $qr_url
 * @property string|null $qr_hash
 * @property string|null $store_name
 * @property string|null $store_tin
 * @property string|null $store_address
 * @property string|null $store_city
 * @property string|null $store_location
 * @property string|null $receipt_number
 * @property string|null $receipt_counter
 * @property string|null $total_amount
 * @property string|null $journal
 * @property array<int, array<string, mixed>>|null $items_data
 * @property string|null $photo_path
 * @property string|null $fetch_error
 * @property int $fetch_attempts
 * @property string|null $note
 * @property Carbon|null $issued_at
 * @property Carbon|null $fetched_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Site $site
 * @mixin Eloquent
 */
class Receipt extends Model
{
    use Filterable;

    // ===== 1. Properties =====

    protected $fillable = [
        'site_id',
        'created_by',
        'status',
        'qr_url',
        'qr_hash',
        'store_name',
        'store_tin',
        'store_address',
        'store_city',
        'store_location',
        'receipt_number',
        'receipt_counter',
        'total_amount',
        'journal',
        'items_data',
        'photo_path',
        'fetch_error',
        'fetch_attempts',
        'note',
        'issued_at',
        'fetched_at',
    ];

    protected $casts = [
        'status' => ReceiptStatus::class,
        'total_amount' => 'decimal:2',
        'items_data' => 'array',
        'fetch_attempts' => 'integer',
        'issued_at' => 'datetime',
        'fetched_at' => 'datetime',
    ];

    // ===== 2. Boot =====

    protected static function booted(): void
    {
        static::deleted(function (Receipt $receipt) {
            if ($receipt->photo_path) {
                Storage::disk('local')->delete($receipt->photo_path);
            }
        });
    }

    // ===== 3. Relationships =====

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class)->withTrashed();
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items(): HasMany
    {
        return $this->hasMany(SiteItem::class);
    }

    // ===== 4. Scopes =====

    /**
     * Pretraga svih racuna (garancija): prodavnica, PIB, broj, tekst racuna, napomena.
     */
    public function scopeFilters(Builder|self $query): Builder|self
    {
        return $query
            ->search(['store_name', 'store_tin', 'receipt_number', 'journal', 'note'])
            ->filterFromRequest('site_id')
            ->filterEnumFromRequest(ReceiptStatus::class, 'status')
            ->sortFromRequest(onlyByFields: ['issued_at', 'created_at', 'total_amount'])
            ->when(! request()->filled('sort'), fn (Builder $q) => $q->orderByDesc('issued_at')->orderByDesc('id'));
    }

    // ===== 5. Helpers =====

    public static function hashUrl(string $url): string
    {
        return hash('sha256', trim($url));
    }
}

<?php

namespace App\Models;

use App\Enums\Currency;
use App\Enums\DocumentType;
use Eloquent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * Izdat dokument za investitora (ponuda ili zavrsni racun): snimak stavki i uplata u
 * trenutku izdavanja + PDF.
 *
 * @property int $id
 * @property int $site_id
 * @property int|null $created_by
 * @property DocumentType $type
 * @property Currency $currency
 * @property string $number
 * @property int $year
 * @property int $sequence
 * @property string $exchange_rate
 * @property string $total_amount
 * @property string $paid_amount
 * @property string $balance_amount
 * @property array<string, mixed> $snapshot
 * @property string|null $pdf_path
 * @property string|null $note
 * @property bool $is_itemized
 * @property Carbon $issued_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Site $site
 * @mixin Eloquent
 */
class Document extends Model
{
    // ===== 1. Properties =====

    protected $fillable = [
        'site_id',
        'created_by',
        'type',
        'currency',
        'number',
        'year',
        'sequence',
        'exchange_rate',
        'total_amount',
        'paid_amount',
        'balance_amount',
        'snapshot',
        'pdf_path',
        'note',
        'is_itemized',
        'issued_at',
    ];

    protected $casts = [
        'type' => DocumentType::class,
        'currency' => Currency::class,
        'year' => 'integer',
        'sequence' => 'integer',
        'exchange_rate' => 'decimal:4',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
        'snapshot' => 'array',
        'is_itemized' => 'boolean',
        'issued_at' => 'date:Y-m-d',
    ];

    // ===== 2. Boot =====

    protected static function booted(): void
    {
        static::deleted(function (Document $document) {
            if ($document->pdf_path) {
                Storage::disk('local')->delete($document->pdf_path);
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
}

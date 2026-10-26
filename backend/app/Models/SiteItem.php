<?php

namespace App\Models;

use App\Enums\Currency;
use App\Enums\ItemType;
use App\Traits\Model\Filterable\Filterable;
use Database\Factories\SiteItemFactory;
use Eloquent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Stavka gradilista: materijal, usluga ili ostali trosak. Oba iznosa (RSD i EUR)
 * se racunaju pri cuvanju po kursu na dan stavke (SaveSiteItemAction).
 *
 * @property int $id
 * @property int $site_id
 * @property int|null $receipt_id
 * @property int|null $item_import_id uvezen iz Excel fajla prodavnice
 * @property int|null $created_by
 * @property ItemType $type
 * @property Currency $currency valuta u kojoj su cene unete
 * @property string $name
 * @property string $unit
 * @property string $quantity
 * @property string $purchase_price cena po jedinici koju je platio izvodjac
 * @property string $sale_price cena po jedinici za investitora
 * @property string $exchange_rate dinara za 1 €
 * @property string $purchase_total_rsd
 * @property string $purchase_total_eur
 * @property string $sale_total_rsd
 * @property string $sale_total_eur
 * @property string|null $note
 * @property bool $is_billable
 * @property bool $is_purchase_estimated nabavna je procena (= cena za investitora) dok se ne upise prava
 * @property Carbon $occurred_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Site $site
 * @property-read Receipt|null $receipt
 * @property-read ItemImport|null $itemImport
 * @mixin Eloquent
 */
class SiteItem extends Model
{
    use Filterable;
    /** @use HasFactory<SiteItemFactory> */
    use HasFactory;

    // ===== 1. Properties =====

    protected $fillable = [
        'site_id',
        'receipt_id',
        'item_import_id',
        'created_by',
        'type',
        'currency',
        'name',
        'unit',
        'quantity',
        'purchase_price',
        'sale_price',
        'exchange_rate',
        'purchase_total_rsd',
        'purchase_total_eur',
        'sale_total_rsd',
        'sale_total_eur',
        'note',
        'is_billable',
        'is_purchase_estimated',
        'occurred_at',
    ];

    protected $casts = [
        'type' => ItemType::class,
        'currency' => Currency::class,
        'quantity' => 'decimal:3',
        'purchase_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'exchange_rate' => 'decimal:4',
        'purchase_total_rsd' => 'decimal:2',
        'purchase_total_eur' => 'decimal:2',
        'sale_total_rsd' => 'decimal:2',
        'sale_total_eur' => 'decimal:2',
        'is_billable' => 'boolean',
        'is_purchase_estimated' => 'boolean',
        'occurred_at' => 'date:Y-m-d',
    ];

    // ===== 2. Relationships =====

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function receipt(): BelongsTo
    {
        return $this->belongsTo(Receipt::class);
    }

    public function itemImport(): BelongsTo
    {
        return $this->belongsTo(ItemImport::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ===== 3. Scopes =====

    public function scopeFilters(Builder|self $query): Builder|self
    {
        return $query
            ->search(['name', 'note'])
            ->filterEnumFromRequest(ItemType::class, 'type')
            ->sortFromRequest(onlyByFields: ['occurred_at', 'name', 'created_at'])
            ->when(! request()->filled('sort'), fn (Builder $q) => $q->orderByDesc('occurred_at')->orderByDesc('id'));
    }

    // ===== 4. Helpers =====

    /**
     * Trenutni podaci stavke u obliku koji prima SaveSiteItemAction, da bi se promenilo samo
     * ono sto se prepise (kurs i datum ostaju isti).
     *
     * @return array<string, mixed>
     */
    public function toSaveData(): array
    {
        return [
            'type' => $this->type->value,
            'currency' => $this->currency->value,
            'name' => $this->name,
            'unit' => $this->unit,
            'quantity' => $this->quantity,
            'purchase_price' => $this->purchase_price,
            'sale_price' => $this->sale_price,
            'exchange_rate' => $this->exchange_rate,
            'note' => $this->note,
            'is_billable' => $this->is_billable,
            'is_purchase_estimated' => $this->is_purchase_estimated,
            'occurred_at' => $this->occurred_at->format('Y-m-d'),
        ];
    }
}

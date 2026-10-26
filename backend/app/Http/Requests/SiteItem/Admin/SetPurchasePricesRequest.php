<?php

namespace App\Http\Requests\SiteItem\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Enums\Currency;
use App\Models\Site;
use App\Traits\FormRequest\NormalizesDecimals;
use Illuminate\Validation\Rules\Exists;

/**
 * Nabavna cena za izabrane stavke gradilista: procenat manje od cene za investitora ili
 * ukupno koliko je placeno (u dinarima ili evrima).
 */
class SetPurchasePricesRequest extends LocalizedFormRequest
{
    use NormalizesDecimals;

    public function rules(): array
    {
        /** @var Site $site */
        $site = $this->route('site');

        return [
            'item_ids' => Ruly::make(true)->array()->max(1000)->assign(),
            'item_ids.*' => Ruly::make(true)
                                ->integer()
                                ->distinct()
                                ->exists('site_items', 'id', fn (Exists $rule) => $rule->where('site_id', $site->id))
                                ->assign(),
            'percent' => Ruly::make()->requiredWithout('total')->numeric()->min(0)->max(100)->assign(),
            'total' => Ruly::make()->requiredWithout('percent')->numeric()->min(0)->max(999_999_999)->assign(),
            'currency' => Ruly::make()->requiredWith('total')->integer()->enum(Currency::class)->assign(),
        ];
    }

    public function attributes(): array
    {
        return [
            'item_ids' => __('attribute_items'),
            'item_ids.*' => __('attribute_items'),
            'percent' => __('attribute_percent'),
            'total' => __('attribute_paid_total'),
            'currency' => __('attribute_currency'),
        ];
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->normalizeDecimals(['percent', 'total']);
    }
}

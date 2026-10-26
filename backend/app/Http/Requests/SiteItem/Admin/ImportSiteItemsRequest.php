<?php

namespace App\Http\Requests\SiteItem\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Traits\FormRequest\NormalizesDecimals;

/**
 * Stavke iz Excel fajlova koje je korisnik ostavio u pregledu, po fajlu; idu kao materijal.
 */
class ImportSiteItemsRequest extends LocalizedFormRequest
{
    use NormalizesDecimals;

    public function rules(): array
    {
        return [
            'occurred_at' => Ruly::make(true)->dateFormat('Y-m-d')->assign(),
            'files' => Ruly::make(true)->array()->max(10)->assign(),
            'files.*.name' => Ruly::make(true)->fullString()->assign(),
            'files.*.items' => Ruly::make(true)->array()->max(1000)->assign(),
            'files.*.items.*.name' => Ruly::make(true)->fullString()->assign(),
            'files.*.items.*.unit' => Ruly::make(false)->fullString(20)->assign(),
            'files.*.items.*.quantity' => Ruly::make(true)->numeric()->greaterThan(0)->max(99_999_999)->assign(),
            'files.*.items.*.sale_price' => Ruly::make(true)->numeric()->min(0)->max(999_999_999)->assign(),
        ];
    }

    public function attributes(): array
    {
        return [
            'occurred_at' => __('attribute_items_date'),
            'files' => __('attribute_spreadsheet_files'),
            'files.*.items' => __('attribute_items'),
            'files.*.items.*.name' => __('attribute_item_name'),
            'files.*.items.*.quantity' => __('attribute_quantity'),
            'files.*.items.*.sale_price' => __('attribute_price'),
        ];
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $files = $this->input('files');

        if (! is_array($files)) {
            return;
        }

        foreach ($files as $index => $file) {
            if (is_array($file) && is_array($file['items'] ?? null)) {
                $files[$index]['items'] = $this->decimalsInRows($file['items'], ['quantity', 'sale_price']);
            }
        }

        $this->merge(['files' => $files]);
    }
}

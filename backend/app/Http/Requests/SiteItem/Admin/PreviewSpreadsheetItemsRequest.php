<?php

namespace App\Http\Requests\SiteItem\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;

/**
 * Jedan ili vise Excel fajlova prodavnice (po ekstenziji; sadrzaj proverava citac).
 */
class PreviewSpreadsheetItemsRequest extends LocalizedFormRequest
{
    public function rules(): array
    {
        return [
            'files' => Ruly::make(true)->array()->max(10)->assign(),
            'files.*' => Ruly::make(true)->file()->custom('extensions:xls,xlsx')->assign(),
        ];
    }

    public function attributes(): array
    {
        return [
            'files' => __('attribute_spreadsheet_files'),
            'files.*' => __('attribute_spreadsheet_file'),
        ];
    }
}

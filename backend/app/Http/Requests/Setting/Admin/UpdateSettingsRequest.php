<?php

namespace App\Http\Requests\Setting\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Enums\Currency;
use App\Models\Setting;
use App\Traits\FormRequest\NormalizesDecimals;

class UpdateSettingsRequest extends LocalizedFormRequest
{
    use NormalizesDecimals;

    public function rules(): array
    {
        return [
            Setting::COMPANY_NAME => Ruly::make(true)->fullString()->assign(),
            Setting::COMPANY_ADDRESS => Ruly::make(false)->fullString()->assign(),
            Setting::COMPANY_CITY => Ruly::make(false)->fullString()->assign(),
            Setting::COMPANY_PHONE => Ruly::make(false)->fullString(50)->assign(),
            Setting::COMPANY_EMAIL => Ruly::make(false)->email()->assign(),
            Setting::COMPANY_PIB => Ruly::make(false)->fullString(30)->assign(),
            Setting::COMPANY_MB => Ruly::make(false)->fullString(30)->assign(),
            Setting::COMPANY_BANK_ACCOUNT => Ruly::make(false)->fullString(50)->assign(),
            Setting::COMPANY_WEBSITE => Ruly::make(false)->fullString()->assign(),
            Setting::DEFAULT_CURRENCY => Ruly::make(true)->integer()->enum(Currency::class)->assign(),
            Setting::DEFAULT_MARKUP_PERCENT => Ruly::make(true)->numeric()->min(0)->max(1000)->assign(),
            Setting::OFFER_NOTE => Ruly::make(false)->string()->max(2000)->assign(),
            Setting::INVOICE_NOTE => Ruly::make(false)->string()->max(2000)->assign(),
        ];
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->normalizeDecimals([Setting::DEFAULT_MARKUP_PERCENT]);
    }
}

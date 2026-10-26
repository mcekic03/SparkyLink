<?php

namespace App\Http\Requests\Site\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Enums\Currency;
use App\Enums\SiteStatus;
use App\Traits\FormRequest\NormalizesDecimals;

class SiteRequest extends LocalizedFormRequest
{
    use NormalizesDecimals;

    public function rules(): array
    {
        return [
            'status' => Ruly::make(true)->integer()->enum(SiteStatus::class)->assign(),
            'currency' => Ruly::make(true)->integer()->enum(Currency::class)->assign(),
            'name' => Ruly::make(true)->fullString()->assign(),
            'address' => Ruly::make(false)->fullString()->assign(),
            'city' => Ruly::make(false)->fullString()->assign(),
            'investor_name' => Ruly::make(false)->fullString()->assign(),
            'investor_phone' => Ruly::make(false)->fullString(50)->assign(),
            'investor_email' => Ruly::make(false)->email()->assign(),
            'investor_address' => Ruly::make(false)->fullString()->assign(),
            'description' => Ruly::make(false)->text()->assign(),
            'markup_percent' => Ruly::make(false)->numeric()->min(0)->max(1000)->assign(),
            'started_at' => Ruly::make(false)->dateFormat('Y-m-d')->assign(),
            'completed_at' => Ruly::make(false)->dateFormat('Y-m-d')->assign(),
        ];
    }

    protected function prepareForValidation(): void
    {
        parent::prepareForValidation();

        $this->normalizeDecimals(['markup_percent']);
    }
}

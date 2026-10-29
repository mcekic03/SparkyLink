<?php

namespace App\Http\Controllers\Setting\Admin;

use App\Actions\Setting\Admin\UpdateSettingsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Setting\Admin\UpdateLogoRequest;
use App\Http\Requests\Setting\Admin\UpdateSettingsRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->success(data: $this->payload());
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        UpdateSettingsAction::make()->handle($request->validated());

        return response()->success(message: __('settings_updated'), data: $this->payload());
    }

    public function logo(UpdateLogoRequest $request): JsonResponse
    {
        UpdateSettingsAction::make()->updateLogo($request->file('logo'));

        return response()->success(message: __('logo_updated'), data: $this->payload());
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(): array
    {
        $logoVersion = (string) Setting::getValue(Setting::COMPANY_LOGO_PATH, 'default');
        $values = collect(Setting::EDITABLE_KEYS)->mapWithKeys(fn (string $key) => [$key => Setting::getValue($key, '')])->all();

        return [
            ...$values,
            Setting::COMPANY_NAME => Setting::getValue(Setting::COMPANY_NAME),
            'logo_url' => '/api/files/logo?v=' . substr(md5($logoVersion), 0, 8),
            Setting::DEFAULT_CURRENCY => (int) Setting::getValue(Setting::DEFAULT_CURRENCY),
        ];
    }
}

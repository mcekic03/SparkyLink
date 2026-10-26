<?php

namespace App\Http\Controllers\Setting\Admin;

use App\Actions\Setting\Admin\UpdateSettingsAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Setting\Admin\UpdateLogoRequest;
use App\Http\Requests\Setting\Admin\UpdateSettingsRequest;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Podesavanja. Radnik dobija samo naziv firme (za zaglavlje aplikacije).
     */
    public function show(Request $request): JsonResponse
    {
        return response()->success(data: $this->payload($request));
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        UpdateSettingsAction::make()->handle($request->validated());

        return response()->success(message: __('settings_updated'), data: $this->payload($request));
    }

    public function logo(UpdateLogoRequest $request): JsonResponse
    {
        UpdateSettingsAction::make()->updateLogo($request->file('logo'));

        return response()->success(message: __('logo_updated'), data: $this->payload($request));
    }

    /**
     * @return array<string, mixed>
     */
    private function payload(Request $request): array
    {
        $logoVersion = (string) Setting::getValue(Setting::COMPANY_LOGO_PATH, 'default');
        $base = [
            Setting::COMPANY_NAME => Setting::getValue(Setting::COMPANY_NAME),
            'logo_url' => '/api/files/logo?v=' . substr(md5($logoVersion), 0, 8),
        ];

        if (! $request->user()->canViewFinances()) {
            return $base;
        }

        $values = collect(Setting::EDITABLE_KEYS)->mapWithKeys(fn (string $key) => [$key => Setting::getValue($key, '')])->all();

        return [
            ...$values,
            ...$base,
            Setting::DEFAULT_CURRENCY => (int) Setting::getValue(Setting::DEFAULT_CURRENCY),
        ];
    }
}

<?php

namespace App\Actions\Setting\Admin;

use App\Models\Setting;
use App\Traits\Core\AsAction;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UpdateSettingsAction
{
    use AsAction;

    /**
     * @param array<string, mixed> $data validirani podaci (UpdateSettingsRequest)
     */
    public function handle(array $data): void
    {
        foreach (Setting::EDITABLE_KEYS as $key) {
            if (array_key_exists($key, $data)) {
                Setting::setValue($key, $data[$key]);
            }
        }
    }

    /**
     * Novi logo firme (za PDF i aplikaciju); stari se brise.
     */
    public function updateLogo(UploadedFile $logo): void
    {
        $old = (string) Setting::getValue(Setting::COMPANY_LOGO_PATH, '');
        $extension = strtolower($logo->getClientOriginalExtension() ?: $logo->extension() ?: 'png');
        $path = $logo->storeAs('branding', 'logo-' . now()->format('YmdHis') . ".{$extension}", 'local');

        Setting::setValue(Setting::COMPANY_LOGO_PATH, $path);

        if ($old !== '' && $old !== $path) {
            Storage::disk('local')->delete($old);
        }
    }
}

<?php

namespace App\Classes\Utilities;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Blade -> PDF preko Gotenberg servisa iz stack-a (Chromium). A4 uspravno ili polozeno, margine u inčima.
 */
class PdfRenderer
{
    /**
     * @param array<string, mixed> $data
     *
     * @throws RuntimeException
     */
    public function render(string $view, array $data, bool $landscape = false): string
    {
        $html = view($view, $data)->render();
        $url = rtrim((string) config('services.gotenberg.url'), '/') . '/forms/chromium/convert/html';

        $response = Http::timeout(90)
                        ->attach('files', $html, 'index.html')
                        ->post($url, [
                            'paperWidth' => $landscape ? '11.69' : '8.27',
                            'paperHeight' => $landscape ? '8.27' : '11.69',
                            'marginTop' => '0.45',
                            'marginBottom' => '0.55',
                            'marginLeft' => '0.45',
                            'marginRight' => '0.45',
                            'printBackground' => 'true',
                        ]);

        if (! $response->successful()) {
            throw new RuntimeException("PDF nije napravljen (Gotenberg {$response->status()}).");
        }

        return $response->body();
    }

    /**
     * Slika kao data URI, da HTML za PDF ne zavisi od mreze.
     */
    public static function imageDataUri(string $path): ?string
    {
        if (! is_file($path)) {
            return null;
        }

        $mime = mime_content_type($path) ?: 'image/png';

        return "data:{$mime};base64," . base64_encode((string) file_get_contents($path));
    }
}

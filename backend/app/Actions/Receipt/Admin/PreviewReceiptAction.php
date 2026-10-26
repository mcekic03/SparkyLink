<?php

namespace App\Actions\Receipt\Admin;

use App\Classes\Utilities\Money;
use App\Contracts\FiscalReceiptFetcher;
use App\Enums\ItemType;
use App\Models\Receipt;
use App\Models\Site;
use App\Services\FiscalReceipts\FetchedReceipt;
use App\Services\FiscalReceipts\ReceiptFetchException;
use App\Traits\Core\AsAction;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PreviewReceiptAction
{
    use AsAction;

    public function __construct(
        private readonly FiscalReceiptFetcher $fetcher,
    ) {}

    /**
     * Preuzima racun po linku sa QR koda i vraca stavke sa predlozenom prodajnom cenom
     * (marza gradilista). Nista se ne cuva; preuzet racun se pamti do uvoza (preview_ttl).
     *
     * @return array<string, mixed>
     *
     * @throws ValidationException
     */
    public function handle(Site $site, string $url, bool $transliterate = true): array
    {
        $url = self::assertValidUrl($url);
        self::assertNotImported($url);

        try {
            $fetched = $this->fetchCached($url);
        } catch (ReceiptFetchException $exception) {
            Log::warning('Fiskalni racun nije preuzet.', ['url' => $url, 'error' => $exception->getMessage()]);

            return ['fetched' => false, 'qr_url' => $url, 'message' => __('receipt_fetch_failed')];
        }

        $markup = $site->effectiveMarkupPercent();

        $items = array_map(fn (array $item) => [
            'type' => ItemType::MATERIAL->value,
            'name' => $transliterate ? cyr_to_lat($item['name']) : $item['name'],
            'unit' => $transliterate ? cyr_to_lat($item['unit']) : $item['unit'],
            'quantity' => $item['quantity'],
            'purchase_price' => $item['unit_price'],
            'sale_price' => Money::applyMarkup($item['unit_price'], $markup),
            'total' => $item['total'],
            'is_billable' => true,
        ], $fetched->items);

        return [
            'fetched' => true,
            'qr_url' => $url,
            'markup_percent' => $markup,
            'receipt' => [...$fetched->toArray(), 'items' => $items],
        ];
    }

    /**
     * Preuzet racun iz kesa (pregled -> uvoz) ili sa sajta Poreske uprave.
     *
     * @throws ReceiptFetchException
     */
    public function fetchCached(string $url): FetchedReceipt
    {
        $key = 'receipt-preview:' . Receipt::hashUrl($url);
        $cached = Cache::get($key);

        if (is_array($cached)) {
            return FetchedReceipt::fromArray($cached);
        }

        $fetched = $this->fetcher->fetch($url);
        Cache::put($key, $fetched->toArray(), (int) config('sparkylink.receipts.preview_ttl'));

        return $fetched;
    }

    /**
     * @throws ValidationException
     */
    public static function assertValidUrl(string $url): string
    {
        $url = trim($url);
        $parts = parse_url($url);

        if (($parts['scheme'] ?? null) !== 'https' || ($parts['host'] ?? null) !== config('sparkylink.receipts.host')) {
            throw ValidationException::withMessages(['qr_url' => __('receipt_invalid_url')]);
        }

        return $url;
    }

    /**
     * @throws ValidationException
     */
    public static function assertNotImported(string $url): void
    {
        $existing = Receipt::query()->with('site:id,name')->where('qr_hash', Receipt::hashUrl($url))->first();

        if ($existing) {
            throw ValidationException::withMessages([
                'qr_url' => __('receipt_already_imported', ['site' => $existing->site?->name ?? '#' . $existing->site_id]),
            ]);
        }
    }
}

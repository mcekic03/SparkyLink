<?php

namespace App\Actions\Receipt\Admin;

use App\Enums\ReceiptStatus;
use App\Models\Receipt;
use App\Models\Site;
use App\Services\FiscalReceipts\FetchedReceipt;
use App\Services\FiscalReceipts\ReceiptFetchException;
use App\Traits\Core\AsAction;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class StoreReceiptAction
{
    use AsAction;

    public function __construct(
        private readonly PreviewReceiptAction $previewReceiptAction,
        private readonly ImportReceiptItemsAction $importReceiptItemsAction,
    ) {}

    /**
     * Cuva racun uz gradiliste. Sa linkom: preuzima racun i uvozi izabrane stavke; ako sajt
     * Poreske uprave ne odgovara, racun ostaje "ceka preuzimanje" (zakazani zadatak pokusava
     * ponovo). Samo sa slikom: racun "slika racuna", stavke se unose rucno.
     *
     * @param array<string, mixed> $data validirani podaci (StoreReceiptRequest)
     *
     * @return array{receipt: Receipt, imported: int}
     *
     * @throws ValidationException
     */
    public function handle(Site $site, array $data, ?UploadedFile $photo = null): array
    {
        $url = isset($data['qr_url']) && $data['qr_url'] !== '' ? PreviewReceiptAction::assertValidUrl($data['qr_url']) : null;

        if ($url) {
            PreviewReceiptAction::assertNotImported($url);
        }

        $fetched = null;
        $error = null;

        if ($url) {
            try {
                $fetched = $this->previewReceiptAction->fetchCached($url);
            } catch (ReceiptFetchException $exception) {
                $error = $exception->getMessage();
            }
        }

        return DB::transaction(function () use ($site, $data, $photo, $url, $fetched, $error) {
            $receipt = Receipt::query()->create([
                'site_id' => $site->id,
                'created_by' => auth()->id(),
                'status' => match (true) {
                    $fetched !== null => ReceiptStatus::FETCHED,
                    $url !== null => ReceiptStatus::PENDING,
                    default => ReceiptStatus::MANUAL,
                },
                'qr_url' => $url,
                'qr_hash' => $url ? Receipt::hashUrl($url) : null,
                'note' => $data['note'] ?? null,
                'store_name' => $data['store_name'] ?? null,
                'issued_at' => $data['issued_at'] ?? null,
                'fetch_error' => $error,
                'fetch_attempts' => $url ? 1 : 0,
                'photo_path' => $photo ? $this->storePhoto($site, $photo) : null,
                ...($fetched ? self::detailsFrom($fetched) : []),
            ]);

            $imported = $fetched && ! empty($data['items'])
                ? $this->importReceiptItemsAction->handle($receipt, $data['items'])
                : 0;

            return ['receipt' => $receipt, 'imported' => $imported];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public static function detailsFrom(FetchedReceipt $fetched): array
    {
        return [
            'store_name' => $fetched->storeName,
            'store_tin' => $fetched->storeTin,
            'store_address' => $fetched->storeAddress,
            'store_city' => $fetched->storeCity,
            'store_location' => $fetched->storeLocation,
            'receipt_number' => $fetched->receiptNumber,
            'receipt_counter' => $fetched->receiptCounter,
            'total_amount' => $fetched->totalAmount,
            'journal' => $fetched->journal,
            'items_data' => $fetched->items,
            'issued_at' => $fetched->issuedAt,
            'fetched_at' => now(),
            'fetch_error' => null,
        ];
    }

    private function storePhoto(Site $site, UploadedFile $photo): string
    {
        $extension = strtolower($photo->getClientOriginalExtension() ?: $photo->extension() ?: 'jpg');

        return $photo->storeAs("receipts/{$site->id}", Str::uuid() . ".{$extension}", 'local');
    }
}

<?php

namespace App\Services\FiscalReceipts;

use App\Contracts\FiscalReceiptFetcher;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Throwable;
use Turanjanin\FiscalReceipts\Data\Receipt;
use Turanjanin\FiscalReceipts\Data\RsdAmount;
use Turanjanin\FiscalReceipts\Parser;

/**
 * Cita racun sa suf.purs.gov.rs: isti link sa QR koda uz `Accept: application/json` vraca
 * `invoiceRequest`, `invoiceResult` i `journal` (tekst racuna); stavke se citaju iz teksta
 * (biblioteka turanjanin/serbian-fiscal-receipts-parser). Ako JSON ne prodje, cita se HTML strana.
 */
class PursFiscalReceiptFetcher implements FiscalReceiptFetcher
{
    public function fetch(string $url): FetchedReceipt
    {
        $timeout = (int) config('sparkylink.receipts.timeout');
        $parser = new Parser();

        try {
            $response = Http::timeout($timeout)->acceptJson()->get($url);
            $data = $response->successful() ? $response->json() : null;

            if (is_array($data) && isset($data['journal'], $data['invoiceRequest'], $data['invoiceResult'])) {
                return $this->map($parser->parseApiResponse($data), (string) $data['journal']);
            }

            $html = Http::timeout($timeout)->get($url)->throw()->body();
            $journal = $this->journalFromHtml($html);

            if ($journal === null) {
                throw new ReceiptFetchException('Strana ne sadrzi tekst racuna.');
            }

            return $this->map($parser->parseJournal($journal), $journal);
        } catch (ReceiptFetchException $exception) {
            throw $exception;
        } catch (ConnectionException $exception) {
            throw new ReceiptFetchException('Sajt Poreske uprave ne odgovara: ' . $exception->getMessage(), 0, $exception);
        } catch (Throwable $exception) {
            throw new ReceiptFetchException('Racun nije procitan: ' . $exception->getMessage(), 0, $exception);
        }
    }

    private function map(Receipt $receipt, string $journal): FetchedReceipt
    {
        $items = [];

        foreach ($receipt->items as $item) {
            $items[] = [
                'name' => trim($item->name),
                'quantity' => rtrim(rtrim(number_format($item->quantity, 3, '.', ''), '0'), '.') ?: '0',
                'unit' => trim($item->unit) ?: 'kom',
                'unit_price' => $this->amount($item->singleAmount),
                'total' => $this->amount($item->totalAmount),
            ];
        }

        return new FetchedReceipt(
            storeName: trim($receipt->store->companyName),
            storeTin: $receipt->store->tin ?: null,
            storeAddress: $receipt->store->address ?: null,
            storeCity: $receipt->store->city ?: null,
            storeLocation: $receipt->store->locationName ?: null,
            receiptNumber: $receipt->number ?: null,
            receiptCounter: $receipt->counter ?: null,
            totalAmount: $this->amount($receipt->totalPurchaseAmount),
            issuedAt: $receipt->date->format('Y-m-d H:i:s'),
            journal: $this->cleanJournal($journal),
            items: $items,
        );
    }

    private function amount(RsdAmount $amount): string
    {
        $paras = $amount->getParas();
        $sign = $paras < 0 ? '-' : '';
        $paras = abs($paras);

        return sprintf('%s%d.%02d', $sign, intdiv($paras, 100), $paras % 100);
    }

    /**
     * Tekst racuna bez ugradjene QR slike (kopija za garanciju crta svoj QR kod).
     */
    private function cleanJournal(string $journal): string
    {
        $journal = str_replace("\r\n", "\n", $journal);
        $journal = (string) preg_replace('/<img[^>]*>/i', '', $journal);

        return rtrim(html_entity_decode(strip_tags($journal), ENT_QUOTES | ENT_HTML5, 'UTF-8'));
    }

    private function journalFromHtml(string $html): ?string
    {
        if (! preg_match('/<pre[^>]*>(.*?)<\/pre>/is', $html, $matches)) {
            return null;
        }

        return html_entity_decode($matches[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }
}

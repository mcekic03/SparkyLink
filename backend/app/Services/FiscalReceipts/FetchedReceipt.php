<?php

namespace App\Services\FiscalReceipts;

/**
 * Racun preuzet sa sajta Poreske uprave, sveden na ono sto SparkyLink cuva.
 * Iznosi su stringovi sa 2 decimale (dinari).
 */
final class FetchedReceipt
{
    /**
     * @param array<int, array{name: string, quantity: string, unit: string, unit_price: string, total: string}> $items
     */
    public function __construct(
        public readonly string $storeName,
        public readonly ?string $storeTin,
        public readonly ?string $storeAddress,
        public readonly ?string $storeCity,
        public readonly ?string $storeLocation,
        public readonly ?string $receiptNumber,
        public readonly ?string $receiptCounter,
        public readonly string $totalAmount,
        public readonly ?string $issuedAt,
        public readonly string $journal,
        public readonly array $items,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'store_name' => $this->storeName,
            'store_tin' => $this->storeTin,
            'store_address' => $this->storeAddress,
            'store_city' => $this->storeCity,
            'store_location' => $this->storeLocation,
            'receipt_number' => $this->receiptNumber,
            'receipt_counter' => $this->receiptCounter,
            'total_amount' => $this->totalAmount,
            'issued_at' => $this->issuedAt,
            'journal' => $this->journal,
            'items' => $this->items,
        ];
    }

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            storeName: (string) ($data['store_name'] ?? ''),
            storeTin: $data['store_tin'] ?? null,
            storeAddress: $data['store_address'] ?? null,
            storeCity: $data['store_city'] ?? null,
            storeLocation: $data['store_location'] ?? null,
            receiptNumber: $data['receipt_number'] ?? null,
            receiptCounter: $data['receipt_counter'] ?? null,
            totalAmount: (string) ($data['total_amount'] ?? '0.00'),
            issuedAt: $data['issued_at'] ?? null,
            journal: (string) ($data['journal'] ?? ''),
            items: $data['items'] ?? [],
        );
    }
}

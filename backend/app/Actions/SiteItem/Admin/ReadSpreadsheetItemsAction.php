<?php

namespace App\Actions\SiteItem\Admin;

use App\Classes\Utilities\Money;
use App\Traits\Core\AsAction;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Cell\Cell;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\RichText\RichText;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Throwable;

class ReadSpreadsheetItemsAction
{
    use AsAction;

    // Zaglavlje tabele se trazi u prvih toliko redova; dalje od toga fajl se ne cita.
    private const HEADER_SEARCH_ROWS = 60;

    private const MAX_ROWS = 2000;

    private const MAX_COLUMNS = 40;

    /**
     * Stavke sa prvog lista Excel fajla prodavnice: naziv, jedinica mere, kolicina, cena po
     * jedinici i ukupno po redu. Zbirni red ("UKUPNO") i sve ispod njega se preskace; ostalo
     * (zbir, preracun u evre) racuna SparkyLink.
     *
     * @return array{name: string, items: array<int, array<string, string>>, error: string|null}
     */
    public function handle(UploadedFile $file): array
    {
        $result = ['name' => $file->getClientOriginalName(), 'items' => [], 'error' => null];

        try {
            $sheet = $this->firstSheet((string) $file->getRealPath());
        } catch (Throwable) {
            return [...$result, 'error' => __('spreadsheet_unreadable')];
        }

        $table = $this->findTable($sheet);

        if ($table === null) {
            return [...$result, 'error' => __('spreadsheet_no_items_table')];
        }

        return [...$result, 'items' => $this->readItems($sheet, $table['row'], $table['columns'])];
    }

    private function firstSheet(string $path): Worksheet
    {
        $type = IOFactory::identify($path, [IOFactory::READER_XLS, IOFactory::READER_XLSX]);
        $reader = IOFactory::createReader($type);
        $reader->setReadDataOnly(true);
        $reader->setLoadSheetsOnly([$reader->listWorksheetNames($path)[0]]);

        return $reader->load($path)->getSheet(0);
    }

    /**
     * Red zaglavlja i kolone tabele, prepoznate po tekstu zaglavlja ("Vrsta dobra-usluge",
     * "Jed. Mere", "Kolicina", "Cena", "Ukupna naknada"...).
     *
     * @return array{row: int, columns: array<string, int>}|null
     */
    private function findTable(Worksheet $sheet): ?array
    {
        $lastRow = min($sheet->getHighestDataRow(), self::HEADER_SEARCH_ROWS);

        for ($row = 1; $row <= $lastRow; $row++) {
            $columns = [];

            for ($column = 1; $column <= $this->lastColumn($sheet); $column++) {
                $key = $this->columnKey($this->text($this->cell($sheet, $column, $row)));

                if ($key !== null && ! isset($columns[$key])) {
                    $columns[$key] = $column;
                }
            }

            if (isset($columns['name'], $columns['quantity']) && (isset($columns['price']) || isset($columns['total']))) {
                return ['row' => $row, 'columns' => $columns];
            }
        }

        return null;
    }

    private function columnKey(string $header): ?string
    {
        $header = $this->normalizeText($header);

        return match (true) {
            $header === '' => null,
            (bool) preg_match('/ukupn|iznos|vrednost|naknada/', $header) => 'total',
            str_contains($header, 'cena') => 'price',
            str_starts_with($header, 'kol') => 'quantity',
            (bool) preg_match('/^(jed|j\.? ?m|mera)/', $header) => 'unit',
            (bool) preg_match('/vrsta dobra|naziv|opis|artik|proizvod|roba/', $header) => 'name',
            default => null,
        };
    }

    /**
     * @param array<string, int> $columns
     *
     * @return array<int, array<string, string>>
     */
    private function readItems(Worksheet $sheet, int $headerRow, array $columns): array
    {
        $items = [];
        $lastRow = min($sheet->getHighestDataRow(), $headerRow + self::MAX_ROWS);

        for ($row = $headerRow + 1; $row <= $lastRow; $row++) {
            if ($this->isTotalRow($sheet, $row, $columns['name'])) {
                break;
            }

            $name = preg_replace('/\s+/u', ' ', trim($this->text($this->cell($sheet, $columns['name'], $row)))) ?? '';
            $quantity = $this->number($this->cell($sheet, $columns['quantity'], $row));
            $price = isset($columns['price']) ? $this->number($this->cell($sheet, $columns['price'], $row)) : null;
            $total = isset($columns['total']) ? $this->number($this->cell($sheet, $columns['total'], $row)) : null;

            // Red bez naziva ili kolicine nije stavka (prazan red, napomena, potpis).
            if ($name === '' || $quantity === null || ! BigDecimal::of($quantity)->isPositive()) {
                continue;
            }

            if (($price === null || BigDecimal::of($price)->isZero()) && $total !== null) {
                $price = (string) BigDecimal::of($total)->dividedBy($quantity, Money::SCALE, RoundingMode::HALF_UP);
            }

            if ($price === null) {
                continue;
            }

            $quantity = (string) BigDecimal::of($quantity)->toScale(3, RoundingMode::HALF_UP)->strippedOfTrailingZeros();
            $price = (string) BigDecimal::of($price)->toScale(Money::SCALE, RoundingMode::HALF_UP);
            $unit = isset($columns['unit']) ? trim($this->text($this->cell($sheet, $columns['unit'], $row))) : '';

            $items[] = [
                'name' => mb_substr($name, 0, 255),
                'unit' => mb_substr($unit, 0, 20) ?: 'kom',
                'quantity' => $quantity,
                'unit_price' => $price,
                'total' => $total !== null
                    ? (string) BigDecimal::of($total)->toScale(Money::SCALE, RoundingMode::HALF_UP)
                    : Money::lineTotal($quantity, $price),
            ];
        }

        return $items;
    }

    /**
     * Zbirni red ("UKUPNO:") zavrsava tabelu; trazi se levo od kolone sa nazivom i u njoj.
     */
    private function isTotalRow(Worksheet $sheet, int $row, int $nameColumn): bool
    {
        for ($column = 1; $column <= $nameColumn; $column++) {
            if (str_starts_with($this->normalizeText($this->text($this->cell($sheet, $column, $row))), 'ukupno')) {
                return true;
            }
        }

        return false;
    }

    private function cell(Worksheet $sheet, int $column, int $row): ?Cell
    {
        return $sheet->cellExists([$column, $row]) ? $sheet->getCell([$column, $row]) : null;
    }

    private function lastColumn(Worksheet $sheet): int
    {
        return min(Coordinate::columnIndexFromString($sheet->getHighestDataColumn()), self::MAX_COLUMNS);
    }

    private function value(?Cell $cell): mixed
    {
        if ($cell === null) {
            return null;
        }

        if (! $cell->isFormula()) {
            return $cell->getValue();
        }

        try {
            return $cell->getCalculatedValue();
        } catch (Throwable) {
            // Funkcija koju biblioteka ne zna: vrednost koju je Excel sacuvao pri poslednjem racunanju.
            return $cell->getOldCalculatedValue();
        }
    }

    private function text(?Cell $cell): string
    {
        $value = $this->value($cell);

        return match (true) {
            $value instanceof RichText => $value->getPlainText(),
            is_scalar($value) => (string) $value,
            default => '',
        };
    }

    /**
     * Broj iz celije kao decimalni string ("1.234,5" u tekstu postaje "1234.5"); null kad nije broj.
     */
    private function number(?Cell $cell): ?string
    {
        $value = $this->value($cell);

        if (is_int($value) || is_float($value)) {
            return Money::normalize($value);
        }

        if (! is_string($value) && ! $value instanceof RichText) {
            return null;
        }

        $normalized = Money::normalize(trim($value instanceof RichText ? $value->getPlainText() : $value));

        return is_numeric($normalized) ? $normalized : null;
    }

    private function normalizeText(string $text): string
    {
        $text = mb_strtolower(trim(cyr_to_lat($text)));

        return strtr($text, ['č' => 'c', 'ć' => 'c', 'š' => 's', 'ž' => 'z', 'đ' => 'dj']);
    }
}

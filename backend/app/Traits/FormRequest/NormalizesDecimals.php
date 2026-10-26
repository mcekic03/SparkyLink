<?php

namespace App\Traits\FormRequest;

use App\Classes\Utilities\Money;

/**
 * Pretvara decimalni zarez u tacku pre validacije ("12,5" -> "12.5"), jer
 * telefon sa srpskom tastaturom tako salje brojeve.
 */
trait NormalizesDecimals
{
    /**
     * @param array<int, string> $fields
     */
    protected function normalizeDecimals(array $fields): void
    {
        $normalized = [];

        foreach ($fields as $field) {
            $value = $this->input($field);

            if (is_string($value) && trim($value) !== '') {
                $normalized[$field] = Money::normalize($value);
            }
        }

        if ($normalized) {
            $this->merge($normalized);
        }
    }

    /**
     * Isto za polja svakog reda liste (npr. `items.*.quantity`); vraca izmenjene redove.
     *
     * @param array<int|string, mixed> $rows
     * @param array<int, string> $fields
     *
     * @return array<int|string, mixed>
     */
    protected function decimalsInRows(array $rows, array $fields): array
    {
        foreach ($rows as $index => $row) {
            foreach ($fields as $field) {
                if (is_array($row) && isset($row[$field]) && is_string($row[$field]) && trim($row[$field]) !== '') {
                    $rows[$index][$field] = Money::normalize($row[$field]);
                }
            }
        }

        return $rows;
    }
}

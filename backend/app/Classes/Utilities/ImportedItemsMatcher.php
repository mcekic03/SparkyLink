<?php

namespace App\Classes\Utilities;

use App\Models\SiteItem;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;
use Illuminate\Support\Collection;

/**
 * Poredi redove nove verzije dokumenta prodavnice sa stavkama ranijeg uvoza: stavka je ista,
 * izmenjena (isti naziv, a promenila se kolicina, jedinica ili cena) ili nova. Nazivi se porede
 * bez obzira na velika slova, kvacice i razmake; isti naziv vise puta uparuje se redom.
 */
final class ImportedItemsMatcher
{
    public const SAME = 'same';

    public const CHANGED = 'changed';

    public const NEW = 'new';

    /**
     * @param Collection<int, SiteItem> $existing stavke ranijeg uvoza
     * @param array<int, array{name: string, unit?: string|null, quantity: string|int|float, price: string|int|float}> $rows
     *
     * @return array{rows: array<int, array{status: string, item: SiteItem|null}>, missing: int}
     */
    public static function match(Collection $existing, array $rows): array
    {
        $queues = [];

        foreach ($existing->sortBy('id') as $item) {
            $queues[self::key($item->name)][] = $item;
        }

        $result = [];

        foreach ($rows as $index => $row) {
            $key = self::key($row['name']);
            $item = empty($queues[$key]) ? null : array_shift($queues[$key]);

            $result[$index] = [
                'status' => match (true) {
                    $item === null => self::NEW,
                    self::differs($item, $row) => self::CHANGED,
                    default => self::SAME,
                },
                'item' => $item,
            ];
        }

        return ['rows' => $result, 'missing' => array_sum(array_map('count', $queues))];
    }

    /**
     * "  RNS  Klema 16 " i "rns klema 16" su isti naziv; cirilica se cita kao latinica.
     */
    public static function key(string $name): string
    {
        $text = mb_strtolower(trim(cyr_to_lat($name)));
        $text = strtr($text, ['č' => 'c', 'ć' => 'c', 'š' => 's', 'ž' => 'z', 'đ' => 'dj']);

        return preg_replace('/\s+/u', ' ', $text) ?? $text;
    }

    /**
     * @param array{name: string, unit?: string|null, quantity: string|int|float, price: string|int|float} $row
     */
    private static function differs(SiteItem $item, array $row): bool
    {
        $unit = mb_strtolower(trim((string) ($row['unit'] ?? ''))) ?: 'kom';

        return BigDecimal::of(Money::normalize($row['quantity']))->compareTo($item->quantity) !== 0
            || BigDecimal::of(Money::normalize($row['price']))->toScale(Money::SCALE, RoundingMode::HALF_UP)->compareTo($item->sale_price) !== 0
            || $unit !== mb_strtolower(trim($item->unit));
    }
}

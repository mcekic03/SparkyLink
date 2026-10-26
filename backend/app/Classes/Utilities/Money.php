<?php

namespace App\Classes\Utilities;

use App\Enums\Currency;
use Brick\Math\BigDecimal;
use Brick\Math\RoundingMode;

/**
 * Racunanje novca bez float-a: iznosi na 2 decimale, kurs na 4, zaokruzivanje
 * "pola navise". Ulazi su stringovi/brojevi kakve daje baza ili zahtev.
 */
final class Money
{
    public const SCALE = 2;

    public const RATE_SCALE = 4;

    /**
     * Kolicina x cena po jedinici, zaokruzeno na pare.
     */
    public static function lineTotal(string|int|float $quantity, string|int|float $unitPrice): string
    {
        return (string) BigDecimal::of(self::normalize($quantity))
                                  ->multipliedBy(self::normalize($unitPrice))
                                  ->toScale(self::SCALE, RoundingMode::HALF_UP);
    }

    /**
     * Iznos u valuti unosa -> oba iznosa (dinari i evri) po kursu (dinara za 1 €).
     *
     * @return array{rsd: string, eur: string}
     */
    public static function toBoth(string|int|float $amount, Currency $currency, string|int|float $rate): array
    {
        $amount = (string) BigDecimal::of(self::normalize($amount))->toScale(self::SCALE, RoundingMode::HALF_UP);

        return match ($currency) {
            Currency::RSD => ['rsd' => $amount, 'eur' => self::convert($amount, Currency::RSD, Currency::EUR, $rate)],
            Currency::EUR => ['rsd' => self::convert($amount, Currency::EUR, Currency::RSD, $rate), 'eur' => $amount],
        };
    }

    public static function convert(string|int|float $amount, Currency $from, Currency $to, string|int|float $rate): string
    {
        $value = BigDecimal::of(self::normalize($amount));

        if ($from === $to) {
            return (string) $value->toScale(self::SCALE, RoundingMode::HALF_UP);
        }

        $rate = BigDecimal::of(self::normalize($rate));

        return (string) ($from === Currency::EUR
            ? $value->multipliedBy($rate)->toScale(self::SCALE, RoundingMode::HALF_UP)
            : $value->dividedBy($rate, self::SCALE, RoundingMode::HALF_UP));
    }

    /**
     * Cena uvecana za maržu u procentima (npr. 100 + 20 % = 120.00).
     */
    public static function applyMarkup(string|int|float $price, string|int|float $percent): string
    {
        $factor = BigDecimal::of(self::normalize($percent))->dividedBy(100, 6, RoundingMode::HALF_UP)->plus(1);

        return (string) BigDecimal::of(self::normalize($price))
                                  ->multipliedBy($factor)
                                  ->toScale(self::SCALE, RoundingMode::HALF_UP);
    }

    /**
     * @param iterable<string|int|float|null> $amounts
     */
    public static function sum(iterable $amounts): string
    {
        $total = BigDecimal::zero();

        foreach ($amounts as $amount) {
            $total = $total->plus(self::normalize($amount ?? 0));
        }

        return (string) $total->toScale(self::SCALE, RoundingMode::HALF_UP);
    }

    public static function subtract(string|int|float $a, string|int|float $b): string
    {
        return (string) BigDecimal::of(self::normalize($a))
                                  ->minus(self::normalize($b))
                                  ->toScale(self::SCALE, RoundingMode::HALF_UP);
    }

    public static function isPositive(string|int|float $amount): bool
    {
        return BigDecimal::of(self::normalize($amount))->isPositive();
    }

    /**
     * "1.234,56" / "12,5" / " 12.5 " -> "1234.56" / "12.5" / "12.5" (telefon sa srpskom tastaturom salje zarez).
     */
    public static function normalize(string|int|float|null $value): string
    {
        if ($value === null || $value === '') {
            return '0';
        }

        if (is_int($value)) {
            return (string) $value;
        }

        if (is_float($value)) {
            return rtrim(rtrim(number_format($value, 6, '.', ''), '0'), '.') ?: '0';
        }

        $value = preg_replace('/[\s\x{00A0}\x{202F}]/u', '', $value) ?? $value;

        if (str_contains($value, ',')) {
            // Zarez je decimalni separator; tacke pre njega su hiljade.
            $value = str_replace(['.', ','], ['', '.'], $value);
        }

        return $value;
    }
}

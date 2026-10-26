<?php

use App\Classes\Utilities\Money;
use App\Enums\Currency;
use App\Enums\PaymentStatus;

test('line total rounds half up to two decimals', function () {
    expect(Money::lineTotal('3', '0.335'))->toBe('1.01')
        ->and(Money::lineTotal('2.5', '10'))->toBe('25.00')
        ->and(Money::lineTotal('0.333', '3'))->toBe('1.00');
});

test('an amount is kept in its own currency and converted to the other one', function () {
    expect(Money::toBoth('100', Currency::EUR, '117.2345'))->toBe(['rsd' => '11723.45', 'eur' => '100.00'])
        ->and(Money::toBoth('11723.45', Currency::RSD, '117.2345'))->toBe(['rsd' => '11723.45', 'eur' => '100.00'])
        ->and(Money::toBoth('1000', Currency::RSD, '117'))->toBe(['rsd' => '1000.00', 'eur' => '8.55']);
});

test('decimal comma from a phone keyboard is understood', function () {
    expect(Money::normalize('12,5'))->toBe('12.5')
        ->and(Money::normalize('1.234,56'))->toBe('1234.56')
        ->and(Money::normalize(' 7.25 '))->toBe('7.25')
        ->and(Money::normalize(null))->toBe('0');
});

test('markup is applied on the purchase price', function () {
    expect(Money::applyMarkup('100', '20'))->toBe('120.00')
        ->and(Money::applyMarkup('85.40', '15.5'))->toBe('98.64');
});

test('payment status follows billed and paid amounts', function () {
    expect(PaymentStatus::fromAmounts('100', '0'))->toBe(PaymentStatus::UNPAID)
        ->and(PaymentStatus::fromAmounts('100', '40'))->toBe(PaymentStatus::PARTIALLY_PAID)
        ->and(PaymentStatus::fromAmounts('100', '100.00'))->toBe(PaymentStatus::PAID)
        ->and(PaymentStatus::fromAmounts('100', '120'))->toBe(PaymentStatus::PAID);
});

test('cyrillic receipt names are transliterated to latin', function () {
    expect(cyr_to_lat('КАБЛ ПП-Ј 3х2,5 / Љубичасти џак'))->toBe('KABL PP-J 3h2,5 / Ljubičasti džak');
});

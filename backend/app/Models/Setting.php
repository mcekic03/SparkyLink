<?php

namespace App\Models;

use Eloquent;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

/**
 * Podesavanja (kljuc-vrednost): podaci firme za obracun i podrazumevane vrednosti.
 *
 * @property int $id
 * @property string $key
 * @property string|null $value
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @mixin Eloquent
 */
class Setting extends Model
{
    use HasFactory;

    public const COMPANY_NAME = 'company_name';

    public const COMPANY_ADDRESS = 'company_address';

    public const COMPANY_CITY = 'company_city';

    public const COMPANY_PHONE = 'company_phone';

    public const COMPANY_EMAIL = 'company_email';

    public const COMPANY_PIB = 'company_pib';

    public const COMPANY_MB = 'company_mb';

    public const COMPANY_BANK_ACCOUNT = 'company_bank_account';

    public const COMPANY_WEBSITE = 'company_website';

    public const COMPANY_LOGO_PATH = 'company_logo_path';

    public const DEFAULT_CURRENCY = 'default_currency';

    public const DEFAULT_MARKUP_PERCENT = 'default_markup_percent';

    // Krupna napomena na ponudi (materijal i kolicine mogu da se razlikuju od zavrsnog racuna).
    public const OFFER_NOTE = 'offer_note';

    // Napomena na dnu zavrsnog racuna.
    public const INVOICE_NOTE = 'invoice_note';

    public const DEFAULT_OFFER_NOTE = 'Cene i količine materijala u ovoj ponudi su okvirne. Tačnu količinu utrošenog '
        . 'materijala nije moguće znati dok se radovi ne završe, a cene materijala mogu da se menjaju. Materijal i '
        . 'količine navedeni u ponudi mogu se razlikovati od konačnog spiska utrošenog materijala na završnom računu. '
        . 'Molimo za razumevanje.';

    /**
     * Podrazumevane vrednosti (upisuju se u migraciji). Prazan logo = logo iz resources/branding.
     */
    public const DEFAULTS = [
        self::COMPANY_NAME => 'Cekić Elektrik',
        self::COMPANY_ADDRESS => '',
        self::COMPANY_CITY => '',
        self::COMPANY_PHONE => '',
        self::COMPANY_EMAIL => '',
        self::COMPANY_PIB => '',
        self::COMPANY_MB => '',
        self::COMPANY_BANK_ACCOUNT => '',
        self::COMPANY_WEBSITE => '',
        self::COMPANY_LOGO_PATH => '',
        self::DEFAULT_CURRENCY => '2',
        self::DEFAULT_MARKUP_PERCENT => '20',
        self::OFFER_NOTE => self::DEFAULT_OFFER_NOTE,
        self::INVOICE_NOTE => 'Hvala na poverenju.',
    ];

    /**
     * Kljucevi koje korisnik menja kroz formu podesavanja (logo ima svoju rutu).
     */
    public const EDITABLE_KEYS = [
        self::COMPANY_NAME,
        self::COMPANY_ADDRESS,
        self::COMPANY_CITY,
        self::COMPANY_PHONE,
        self::COMPANY_EMAIL,
        self::COMPANY_PIB,
        self::COMPANY_MB,
        self::COMPANY_BANK_ACCOUNT,
        self::COMPANY_WEBSITE,
        self::DEFAULT_CURRENCY,
        self::DEFAULT_MARKUP_PERCENT,
        self::OFFER_NOTE,
        self::INVOICE_NOTE,
    ];

    private const CACHE_KEY = 'settings.all';

    // ===== 1. Properties =====

    protected $fillable = [
        'key',
        'value',
    ];

    // ===== 2. Boot =====

    protected static function booted(): void
    {
        static::saved(fn () => self::flushCache());
        static::deleted(fn () => self::flushCache());
    }

    // ===== 3. Helpers =====

    /**
     * @return array<string, string|null>
     */
    public static function allValues(): array
    {
        return Cache::rememberForever(
            self::CACHE_KEY,
            fn () => self::query()->pluck('value', 'key')->all()
        );
    }

    public static function getValue(string $key, mixed $default = null): mixed
    {
        $value = self::allValues()[$key] ?? null;

        return $value === null || $value === '' ? ($default ?? self::DEFAULTS[$key] ?? null) : $value;
    }

    public static function setValue(string $key, mixed $value): void
    {
        self::query()->updateOrCreate(
            ['key' => $key],
            ['value' => is_null($value) ? null : (string) $value]
        );

        self::flushCache();
    }

    public static function flushCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /**
     * Podaci firme za zaglavlje obracuna.
     *
     * @return array<string, string>
     */
    public static function company(): array
    {
        return [
            'name' => (string) self::getValue(self::COMPANY_NAME),
            'address' => (string) self::getValue(self::COMPANY_ADDRESS, ''),
            'city' => (string) self::getValue(self::COMPANY_CITY, ''),
            'phone' => (string) self::getValue(self::COMPANY_PHONE, ''),
            'email' => (string) self::getValue(self::COMPANY_EMAIL, ''),
            'pib' => (string) self::getValue(self::COMPANY_PIB, ''),
            'mb' => (string) self::getValue(self::COMPANY_MB, ''),
            'bank_account' => (string) self::getValue(self::COMPANY_BANK_ACCOUNT, ''),
            'website' => (string) self::getValue(self::COMPANY_WEBSITE, ''),
        ];
    }

    public static function defaultMarkupPercent(): string
    {
        return (string) self::getValue(self::DEFAULT_MARKUP_PERCENT, (string) config('sparkylink.default_markup_percent'));
    }

    /**
     * Apsolutna putanja do loga firme (otpremljen ili podrazumevani iz resources/branding).
     */
    public static function logoPath(): string
    {
        $custom = (string) self::getValue(self::COMPANY_LOGO_PATH, '');

        if ($custom !== '' && is_file(storage_path("app/private/{$custom}"))) {
            return storage_path("app/private/{$custom}");
        }

        return resource_path('branding/logo.png');
    }
}

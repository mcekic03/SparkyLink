<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Kurs evra (srednji kurs NBS)
    |--------------------------------------------------------------------------
    |
    | Javni servis bez kljuca koji svakog jutra preuzima kursnu listu NBS.
    | {date} se zamenjuje danom u formatu YYYY-MM-DD.
    |
    */

    'exchange_rate' => [
        'url' => env('EXCHANGE_RATE_URL', 'https://kurs.resenje.org/api/v1/currencies/eur/rates/{date}'),
        'timeout' => 10,
    ],

    /*
    |--------------------------------------------------------------------------
    | Fiskalni racuni (QR kod -> sajt Poreske uprave)
    |--------------------------------------------------------------------------
    */

    'receipts' => [
        'host' => 'suf.purs.gov.rs',
        'timeout' => 15,
        // Koliko dugo se pamti preuzet racun izmedju pregleda i uvoza (sekunde).
        'preview_ttl' => 1800,
        // Posle ovoliko neuspesnih pokusaja racun ostaje u statusu "greska".
        'max_fetch_attempts' => 10,
    ],

    /*
    |--------------------------------------------------------------------------
    | Slike i video snimci (velicine u kilobajtima)
    |--------------------------------------------------------------------------
    */

    'media' => [
        'image_max_kb' => 1024 * 25,
        'video_max_kb' => 1024 * (int) env('VIDEO_MAX_MB', 512),
        'thumbnail_width' => 480,
    ],

    // Potpisani linkovi ka privatnim fajlovima (slike, PDF) vaze ovoliko minuta.
    'signed_url_minutes' => 120,

    // Podrazumevana marza (%) kad je gradiliste i podesavanja nemaju.
    'default_markup_percent' => 20,
];

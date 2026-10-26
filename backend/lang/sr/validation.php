<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | The following language lines contain the default error messages used by
    | the validator class. Some of these rules have multiple versions such
    | as the size rules. Feel free to tweak each of these messages here.
    |
    */

    'accepted' => ':Attribute mora biti prihvaćen.',
    'accepted_if' => ':Attribute mora biti prihvaćen kada je :other :value',
    'active_url' => ':Attribute nije važeća URL adresa',
    'after' => ':Attribute mora biti datum posle :date datuma',
    'after_or_equal' => ':Attribute mora biti datum posle ili jednak :date datuma.',
    'alpha' => ':Attribute mora da sadrži samo slova',
    'alpha_dash' => ':Attribute mora da sadrži samo slova, brojeve, crtice i donje crte.',
    'alpha_num' => ':Attribute mora da sadrži samo slova i brojeve.',
    'array' => ':Attribute mora biti niz',
    'before' => ':Attribute mora biti datum pre :date datuma.',
    'before_or_equal' => ':Attribute mora biti datum pre ili jednak :date datuma.',
    'between' => [
        'array' => ':Attribute mora imati između :min i :max stavki.',
        'file' => ':Attribute mora biti između :min i :max kilobajta.',
        'numeric' => ':Attribute mora biti između :min i :max.',
        'string' => ':Attribute mora imati između :min i :max karaktera.',
    ],
    'boolean' => ':Attribute mora imati vrednost tačno ili netačno(true ili false). ',
    'confirmed' => 'Potvrda :attribute polja se ne podudara.',
    'current_password' => 'Lozinka je netačna.',
    'date' => ':Attribute nije važeći datum.',
    'date_equals' => ':Attribute mora biti datum jednak :date datumu.',
    'date_format' => ':Attribute ne odgovara formatu :format.',
    'declined' => ':Attribute mroa biti odbijen.',
    'declined_if' => ':Attribute mora biti odbijen kada je :other :value.',
    'different' => ':Attribute i :other moraju biti različiti.',
    'digits' => ':Attribute mora imati :digits cifara.',
    'digits_between' => ':Attribute mora imati između :min i :max cifara.',
    'dimensions' => ':Attribute nema validne dimenzije slike.',
    'distinct' => ':Attribute ima duplikat vrednosti.',
    'doesnt_end_with' => ':Attribute se ne sme završavati sa jednom od sledećih vrednosti: :values.',
    'doesnt_start_with' => ':Attribute ne sme počinjati sa jednom od sledećih vrednosti: :values.',
    'email' => ':Attribute mora biti važeća email adresa.',
    'ends_with' => ':Attribute mora da se završava sa jednom od sledećih vrednosti: :values.',
    'enum' => ':Attribute je nevažeći.',
    'extensions' => ':Attribute mora imati jednu od sledećih ekstenzija: :values.',
    'exists' => ':Attribute je nevažeći.',
    'file' => ':Attribute mora biti fajl.',
    'filled' => ':Attribute mora imati vrednost.',
    'gt' => [
        'array' => ':Attribute mora imati vise od :value stavki.',
        'file' => ':Attribute mora imati vise od :value kilobajta.',
        'numeric' => ':Attribute mora imati vrednost veću od :value.',
        'string' => ':Attribute mora imati više od :value karaktera.',
    ],
    'gte' => [
        'array' => ':Attribute mora imati :value stavki ili više.',
        'file' => ':Attribute mora imati :value kilobajta ili više.',
        'numeric' => ':Attribute mora imati vrednost :value ili više.',
        'string' => ':Attribute mora imati :value karaktera ili više.',
    ],
    'image' => ':Attribute mora biti slika.',
    'in' => ':Attribute je nevažeći.',
    'in_array' => ':Attribute ne postoji u :other.',
    'integer' => ':Attribute mora biti ceo broj.',
    'ip' => ':Attribute mora biti validna IP adresa.',
    'ipv4' => ':Attribute mora biti validna IPv4 adresa.',
    'ipv6' => ':Attribute mora biti validna IPv6 adresa.',
    'json' => ':Attribute mora biti validan JSON string.',
    'lt' => [
        'array' => ':Attribute mora imati manje od :value stavki.',
        'file' => ':Attribute mora imati manje od :value kilobajta.',
        'numeric' => ':Attribute mora imati vrednost manju od :value.',
        'string' => ':Attribute mora imati manje od :value karaktera.',
    ],
    'lte' => [
        'array' => ':Attribute ne sme imati više od :value stavki.',
        'file' => ':Attribute mora imati :value kilobajta ili manje.',
        'numeric' => ':Attribute mora imati vrednost :value ili manje.',
        'string' => ':Attribute mora imati :value karaktera ili manje.',
    ],
    'mac_address' => ':Attribute mora biti validna MAC adresa',
    'max' => [
        'array' => ':Attribute ne sme imati više od :max stavki.',
        'file' => ':Attribute ne sme imati više od :max kilobajta.',
        'numeric' => ':Attribute ne sme imati vrednost veću od :max.',
        'string' => ':Attribute ne sme imati više od :max karaktera.',
    ],
    'mimes' => ':Attribute mora biti fajl tipa :values.',
    'mimetypes' => ':Attribute mora biti fajl tipa :values.',
    'min' => [
        'array' => ':Attribute mora imati najmanje :min stavki.',
        'file' => ':Attribute mora imati najmanje :min kilobajta.',
        'numeric' => ':Attribute mora imati vrednost najmanje :min.',
        'string' => ':Attribute mora imati najmanje :min karaktera.',
    ],
    'multiple_of' => ':Attribute mora biti mnozilac :value.',
    'not_in' => ':Attribute je nevažeći.',
    'not_regex' => ':Attribute je u pogrešnom formatu.',
    'numeric' => ':Attribute mora biti broj.',
    'password' => [
        'letters' => ':Attribute mora sadržati barem jedno slovo.',
        'mixed' => ':Attribute mora sadržati barem jedno veliko i jedno malo slovo.',
        'numbers' => ':Attribute mora sadržati barem jedan broj.',
        'symbols' => ':Attribute mora sadržati barem jedan simbol.',
        'uncompromised' => ':Attribute je nesiguran. Molimo promenite unešenu vrednost',
    ],
    'present' => ':Attribute mora biti prisutan.',
    'prohibited' => ':Attribute je zabranjen.',
    'prohibited_if' => ':Attribute je zabranjen kada je :other :value.',
    'prohibited_unless' => ':Attribute je zabranjen osim ako je :other :value.',
    'prohibits' => ':Attribute zabranjuje prisustvo :other.',
    'regex' => ':Attribute je u pogrešnom formatu.',
    'required' => 'Polje :attribute je obavezno.',
    'required_array_keys' => ':Attribute mora da sadrži sledeće unose: :values.',
    'required_if' => 'Polje :attribute je obavezno kada je :other :value.',
    'required_unless' => 'Polje :attribute je obavezno osim ako je :other :value.',
    'required_with' => 'Polje :attribute je obavezno kada je polje :values prisutno.',
    'required_with_all' => 'Poje :attribute je obavezno kada su prisutni :values.',
    'required_without' => 'Poje :attribute je obavezno kada su nisu prisutni :values.',
    'required_without_all' => 'Poje :attribute je obavezno kada nije prisutan ni jedan od :values.',
    'same' => ':Attribute i :other moraju da se podudaraju.',
    'size' => [
        'array' => ':Attribute mora imati tačno :size stavki.',
        'file' => ':Attribute mora imati tačno :size kilobajta.',
        'numeric' => ':Attribute mora imati vrednost :size.',
        'string' => ':Attribute mora imati tačno :size karaktera.',
    ],
    'starts_with' => ':Attribute mora početi sa jednom od sledećih vrednosti: :values.',
    'string' => ':Attribute mora biti niz karaktera(string).',
    'timezone' => ':Attribute mora biti validna vremenska zona.',
    'unique' => 'Polje :attribute je već zauzeto.',
    'uploaded' => 'Otpremanje :attribute nije uspelo.',
    'url' => ':Attribute mora biti validan URL.',
    'uuid' => ':Attribute mora biti validan UUID.',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Lines
    |--------------------------------------------------------------------------
    |
    */

    'date_exists' => 'Izabrani :attribute već postoji.',
    'max_nights' => 'Boravak može trajati najviše :max noćenja.',
    'period_overlap' => 'Ova sezona se preklapa sa postojećom.',
    'capacity_exceeded' => 'Apartman prima najviše :capacity osoba.',
    'apartment_inactive' => 'Ovaj apartman trenutno nije dostupan.',

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Language Lines
    |--------------------------------------------------------------------------
    |
    | Here you may specify custom validation messages for attributes using the
    | convention "attribute.rule" to name the lines. This makes it quick to
    | specify a specific custom language line for a given attribute rule.
    |
    */

    'custom' => [
        'attribute-name' => [
            'rule-name' => 'custom-message',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Custom Validation Attributes
    |--------------------------------------------------------------------------
    |
    | The following language lines are used to swap our attribute placeholder
    | with something more reader friendly such as "E-Mail Address" instead
    | of "email". This simply helps us make our message more expressive.
    |
    */

    'attributes' => [
        'apartment' => 'apartman',
        'check_in_date' => 'datum dolaska',
        'check_out_date' => 'datum odlaska',
        'adults' => 'broj odraslih',
        'children_under_12' => 'deca 5-11 god.',
        'children_under_5' => 'deca 0-4 god.',
        'has_meals' => 'polupansion',
        'guest_name' => 'ime',
        'guest_email' => 'mejl',
        'guest_phone' => 'telefon',
        'guest_note' => 'poruka',
        'final_total' => 'konačna cena',
        'accommodation_price' => 'cena smeštaja',
        'meal_price' => 'cena polupansiona',
        'starts_at' => 'datum početka',
        'ends_at' => 'datum kraja',
        'name' => 'ime',
        'email' => 'mejl',
        'password' => 'lozinka',
        'role_id' => 'uloga',
    ],
];

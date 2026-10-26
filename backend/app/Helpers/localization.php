<?php

if (! function_exists('__n')) {
    /**
     * Translates value from given key in plural manner.
     * Same if you would use trans_choice but this can be used with JSON translations.
     *
     * @param string $key
     * @param int $count
     * @param array $replace
     *
     * @return string
     */
    function __n(string $key, int $count, array $replace = []): string
    {
        return trans_choice(__($key), $count, $replace);
    }
}

if (! function_exists('__lc')) {
    /**
     * Returns translation in lowercase.
     *
     * @param string $key
     * @param array $replace
     * @param string|null $locale
     *
     * @return string
     */
    function __lc(string $key, array $replace = [], ?string $locale = null): string
    {
        return strtolower(__($key, $replace, $locale));
    }
}

if (! function_exists('__uc')) {
    /**
     * Returns translation in uppercase.
     *
     * @param string $key
     * @param array $replace
     * @param string|null $locale
     *
     * @return string
     */
    function __uc(string $key, array $replace = [], ?string $locale = null): string
    {
        return strtoupper(__($key, $replace, $locale));
    }
}

if (! function_exists('cyr_to_lat')) {
    /**
     * Preslovljava srpsku cirilicu u latinicu (nazivi stavki sa fiskalnih racuna).
     */
    function cyr_to_lat(string $text): string
    {
        static $map = [
            'Љ' => 'Lj', 'Њ' => 'Nj', 'Џ' => 'Dž', 'љ' => 'lj', 'њ' => 'nj', 'џ' => 'dž',
            'А' => 'A', 'Б' => 'B', 'В' => 'V', 'Г' => 'G', 'Д' => 'D', 'Ђ' => 'Đ', 'Е' => 'E', 'Ж' => 'Ž',
            'З' => 'Z', 'И' => 'I', 'Ј' => 'J', 'К' => 'K', 'Л' => 'L', 'М' => 'M', 'Н' => 'N', 'О' => 'O',
            'П' => 'P', 'Р' => 'R', 'С' => 'S', 'Т' => 'T', 'Ћ' => 'Ć', 'У' => 'U', 'Ф' => 'F', 'Х' => 'H',
            'Ц' => 'C', 'Ч' => 'Č', 'Ш' => 'Š',
            'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd', 'ђ' => 'đ', 'е' => 'e', 'ж' => 'ž',
            'з' => 'z', 'и' => 'i', 'ј' => 'j', 'к' => 'k', 'л' => 'l', 'м' => 'm', 'н' => 'n', 'о' => 'o',
            'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't', 'ћ' => 'ć', 'у' => 'u', 'ф' => 'f', 'х' => 'h',
            'ц' => 'c', 'ч' => 'č', 'ш' => 'š',
        ];

        return strtr($text, $map);
    }
}

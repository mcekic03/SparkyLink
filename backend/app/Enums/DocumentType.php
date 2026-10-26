<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

/**
 * Dve vrste PDF dokumenta za investitora - isti izgled, razlikuju se naslov i poruka.
 */
enum DocumentType: int
{
    use HasEnumHelpers;

    // Ponuda cene kostanja pre radova (sa napomenom da se materijal moze razlikovati).
    case OFFER = 1;

    // Zavrsni racun za dugovanje (sa uplatama i preostalim dugom).
    case FINAL_INVOICE = 2;

    public function label(): string
    {
        return match ($this) {
            DocumentType::OFFER => __('document_type_offer'),
            DocumentType::FINAL_INVOICE => __('document_type_final_invoice'),
        };
    }

    /**
     * Naslov na PDF-u.
     */
    public function title(): string
    {
        return match ($this) {
            DocumentType::OFFER => 'PONUDA',
            DocumentType::FINAL_INVOICE => 'ZAVRŠNI RAČUN',
        };
    }
}

<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

enum ItemType: int
{
    use HasEnumHelpers;

    case MATERIAL = 1;

    case SERVICE = 2;

    case OTHER = 3;

    public function label(): string
    {
        return match ($this) {
            ItemType::MATERIAL => __('item_type_material'),
            ItemType::SERVICE => __('item_type_service'),
            ItemType::OTHER => __('item_type_other'),
        };
    }

    /**
     * Ostali troskovi (gorivo, masine...) se podrazumevano ne naplacuju investitoru.
     */
    public function isBillableByDefault(): bool
    {
        return $this !== ItemType::OTHER;
    }

    /**
     * Usluga nema nabavnu cenu - trosak rada ide kroz evidenciju radnika.
     */
    public function hasPurchasePrice(): bool
    {
        return $this !== ItemType::SERVICE;
    }
}

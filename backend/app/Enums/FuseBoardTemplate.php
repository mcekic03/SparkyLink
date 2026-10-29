<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

/**
 * Izgled PDF-a rasporeda osiguraca (A4 polozeno); bira se pri svakom otvaranju.
 */
enum FuseBoardTemplate: int
{
    use HasEnumHelpers;

    // Tabela u dve kolone.
    case TABLE = 1;

    // Osiguraci nacrtani na DIN sini, kao u ormaru.
    case RAIL = 2;

    // Kartica za svaki osigurac, tamno zaglavlje.
    case CARDS = 3;

    // Sema izvoda sa tablicom podataka, kao list iz projekta.
    case DRAWING = 4;

    public function view(): string
    {
        return match ($this) {
            FuseBoardTemplate::TABLE => 'pdf.fuse-board.table',
            FuseBoardTemplate::RAIL => 'pdf.fuse-board.rail',
            FuseBoardTemplate::CARDS => 'pdf.fuse-board.cards',
            FuseBoardTemplate::DRAWING => 'pdf.fuse-board.drawing',
        };
    }

    /**
     * Koliko osiguraca staje na jednu stranu; ostali prelaze na sledecu.
     */
    public function perPage(): int
    {
        return match ($this) {
            FuseBoardTemplate::TABLE, FuseBoardTemplate::RAIL => 24,
            FuseBoardTemplate::CARDS, FuseBoardTemplate::DRAWING => 18,
        };
    }
}

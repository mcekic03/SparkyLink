<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

/**
 * Sistem ima jedan nalog, vlasnika; uloga ostaje jer na njoj radi prijava iz sablona.
 */
enum Role: int
{
    use HasEnumHelpers;

    case SUPER_ADMIN = 1;

    public function slug(): string
    {
        return match ($this) {
            Role::SUPER_ADMIN => 'super-admin',
        };
    }

    public static function fromSlug(string $slug): self
    {
        return match ($slug) {
            'super-admin' => Role::SUPER_ADMIN,
        };
    }

    public function label(): string
    {
        return match ($this) {
            Role::SUPER_ADMIN => __('role_super_admin'),
        };
    }
}

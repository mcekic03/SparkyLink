<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

enum Role: int
{
    use HasEnumHelpers;

    case SUPER_ADMIN = 1;

    case ADMIN = 2;

    case WORKER = 3;

    public function slug(): string
    {
        return match ($this) {
            Role::SUPER_ADMIN => 'super-admin',
            Role::ADMIN => 'admin',
            Role::WORKER => 'worker',
        };
    }

    public static function fromSlug(string $slug): self
    {
        return match ($slug) {
            'super-admin' => Role::SUPER_ADMIN,
            'admin' => Role::ADMIN,
            'worker' => Role::WORKER,
        };
    }

    public function label(): string
    {
        return match ($this) {
            Role::SUPER_ADMIN => __('role_super_admin'),
            Role::ADMIN => __('role_admin'),
            Role::WORKER => __('role_worker'),
        };
    }

    /**
     * Radnik ne vidi iznose, zaradu, uplate ni obracune.
     */
    public function canViewFinances(): bool
    {
        return $this !== Role::WORKER;
    }
}

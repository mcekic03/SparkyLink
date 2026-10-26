<?php

namespace App\Enums\ActivityLog;

use App\Models\Site;
use App\Models\User;

enum LogSubjectType: int
{
    case USER = 1;

    case SITE = 2;

    public function loggableName(): string
    {
        return match ($this) {
            self::USER => __('activity_logs.user'),
            self::SITE => __('activity_logs.site'),
        };
    }

    public function identifier(): string
    {
        return match ($this) {
            self::USER => User::class,
            self::SITE => Site::class,
        };
    }

    public static function fromIdentifier(string $classFQN): self
    {
        return match ($classFQN) {
            User::class => self::USER,
            Site::class => self::SITE,
        };
    }
}

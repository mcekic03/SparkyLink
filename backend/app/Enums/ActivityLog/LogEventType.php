<?php

namespace App\Enums\ActivityLog;

enum LogEventType: string
{
    case CREATED = 'created';

    case UPDATED = 'updated';

    case DELETED = 'deleted';

    case RESTORED = 'restored';

    case LOGIN = 'login';

    public function message(LogSubjectType $logSubjectType, string $subjectName): string
    {
        $translationKey = match ($this) {
            self::CREATED => 'create_event',
            self::UPDATED => 'update_event',
            self::DELETED => 'delete_event',
            self::RESTORED => 'restore_event',
            self::LOGIN => 'login_event',
        };

        return __("activity_logs.{$translationKey}", [
            'entity' => $logSubjectType->loggableName(),
            'name' => $subjectName,
        ]);
    }

    public static function fromString(string $value): self
    {
        return match ($value) {
            'created' => self::CREATED,
            'updated' => self::UPDATED,
            'deleted' => self::DELETED,
            'restored' => self::RESTORED,
            'login' => self::LOGIN,
        };
    }
}

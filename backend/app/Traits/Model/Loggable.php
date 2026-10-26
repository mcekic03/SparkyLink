<?php

namespace App\Traits\Model;

use Spatie\Activitylog\Contracts\Activity;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

trait Loggable
{
    use LogsActivity;

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
                         ->logFillable()
                         ->logExcept(['password'])
                         ->logOnlyDirty()
                         ->dontSubmitEmptyLogs();
    }

    public function tapActivity(Activity $activity, ?string $eventName): void
    {
        $loggableNameKey = $this->getLoggableNameKey();

        $activity->loggable_name = $activity->changes()->get('old')[$loggableNameKey] ?? $this->{$loggableNameKey};
    }

    public function getLoggableNameKey(): string
    {
        return 'name';
    }
}

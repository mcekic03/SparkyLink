<?php

namespace App\Traits\Model;

use App\Exceptions\MissingParameterException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * This trait makes model timezone aware.
 * It will convert any specified date fields that need to be timezone-aware from client timezone to UTC.
 *
 * All dates should be stored in UTC, therefore the need for this trait.
 * When a client tries to store some data from a specific timezone(client will always send X-Client-Timezone) header,
 * we need to use this timezone to convert dates sent in the request to the UTC, so when data is being retrieved,
 * we get the  correct date value for that specific timezone or any other one.
 */
trait IsTimezoneAware
{
    /**
     * Before create/update set defaults provided on model.
     *
     * @return void
     *
     * @throws MissingParameterException
     */
    protected static function bootIsTimezoneAware()
    {
        if (! property_exists(static::class, 'timezoneAwareDates')) {
            throw new MissingParameterException(class: static::class, property: 'timezoneAwareDates');
        }

        static::creating(function (Model $model) {
            $model->convertTimezoneAwareDatesToUTC();
        });

        static::updating(function (Model $model) {
            $model->convertTimezoneAwareDatesToUTC();
        });
    }

    private function convertTimezoneAwareDatesToUTC(): void
    {
        $timezone = config('app.client_timezone');

        if (! $timezone || $timezone === 'UTC') {
            return;
        }

        foreach ($this->getTimezoneAwareDates() as $field) {
            if (! in_array($field, array_keys($this->getDirty()))) {
                continue;
            }

            $this->{$field} = Carbon::parse($this->{$field})
                                     ->shiftTimezone($timezone)
                                     ->setTimezone('UTC');
        }
    }

    private function getTimezoneAwareDates(): array
    {
        return $this->timezoneAwareDates;
    }
}

<?php

namespace App\Models;

use App\Enums\ActivityLog\LogEventType;
use App\Enums\ActivityLog\LogSubjectType;
use App\Traits\Model\Filterable\Filterable;
use Eloquent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Spatie\Activitylog\Models\Activity as SpatieActivity;

/**
 * App\Models\ActivityLog
 *
 * @property int $id
 * @property string|null $log_name
 * @property string|null $loggable_name
 * @property string $description
 * @property string|null $subject_type
 * @property string|null $event
 * @property int|null $subject_id
 * @property string|null $causer_type
 * @property int|null $causer_id
 * @property \Illuminate\Support\Collection<array-key, mixed>|null $properties
 * @property string|null $batch_uuid
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Model|null $causer
 * @property-read LogEventType $event_type
 * @property-read Collection $changes
 * @property-read mixed $message
 * @property-read \Illuminate\Database\Eloquent\Model|null $subject
 * @method static Builder<static>|ActivityLog active(string $column = 'is_active')
 * @method static Builder<static>|ActivityLog causedBy(\Illuminate\Database\Eloquent\Model $causer)
 * @method static Builder<static>|ActivityLog conditionallyFilterDateBetween(?\Carbon\CarbonInterface $dateFrom = null, ?\Carbon\CarbonInterface $dateTo = null, string $dateColumn = 'created_at')
 * @method static Builder<static>|ActivityLog conditionallyFilterDateBetweenByMonth(?\Carbon\CarbonInterface $dateFrom = null, ?\Carbon\CarbonInterface $dateTo = null, string $dateColumn = 'created_at')
 * @method static Builder<static>|ActivityLog filter(array|string $columns, ?string $filter = '')
 * @method static Builder<static>|ActivityLog filterBetweenFromRequest(string $column, ?string $requestKey = null)
 * @method static Builder<static>|ActivityLog filterBoolFromRequest(string $requestKey, ?mixed $default = false, ?string $databaseField = null)
 * @method static Builder<static>|ActivityLog filterEnumFromRequest(string $enumClass, ?string $requestKey = null, ?string $databaseField = null, ?string $altRequestKey = null)
 * @method static Builder<static>|ActivityLog filterExistsFromRequest(string $requestKey, ?string $databaseField = null, ?mixed $default = false)
 * @method static Builder<static>|ActivityLog filterFromRequest(string $requestKey, string $operator = '=', ?mixed $default = null, ?string $databaseField = null)
 * @method static Builder<static>|ActivityLog filterJsonContainsFromRequest(string $requestKey, ?mixed $default = null, ?string $databaseField = null)
 * @method static Builder<static>|ActivityLog filterOrWhereHasInFromRequest(string $relation, string $requestKey, ?string $databaseField = null, ?mixed $default = null)
 * @method static Builder<static>|ActivityLog filterWhereHas(string $relation, array|string $columns, ?string $filter = '')
 * @method static Builder<static>|ActivityLog filterWhereHasFromRequest(string $relation, string $requestKey, ?string $databaseField = null, string $operator = '=', ?mixed $default = null)
 * @method static Builder<static>|ActivityLog filterWhereHasInFromRequest(string $relation, string $requestKey, ?string $databaseField = null, ?mixed $default = null)
 * @method static Builder<static>|ActivityLog filterWhereInFromRequest(string $requestKey, ?string $databaseField = null, ?mixed $default = null)
 * @method static Builder<static>|ActivityLog forAuthUser(string $column = 'user_id')
 * @method static Builder<static>|ActivityLog forBatch(string $batchUuid)
 * @method static Builder<static>|ActivityLog forEvent(string $event)
 * @method static Builder<static>|ActivityLog forSubject(\Illuminate\Database\Eloquent\Model $subject)
 * @method static Builder<static>|ActivityLog forSubjectType(?\App\Enums\ActivityLog\LogSubjectType $subjectType)
 * @method static Builder<static>|ActivityLog hasBatch()
 * @method static Builder<static>|ActivityLog inLog(...$logNames)
 * @method static Builder<static>|ActivityLog initialSort(string $sortKey = 'sort')
 * @method static Builder<static>|ActivityLog newModelQuery()
 * @method static Builder<static>|ActivityLog newQuery()
 * @method static Builder<static>|ActivityLog orFilterFromRequest(string $requestKey, string $operator = '=', ?mixed $default = null, ?string $databaseField = null)
 * @method static Builder<static>|ActivityLog orFilterWhereHas(string $relation, array|string $columns, ?string $filter = '')
 * @method static Builder<static>|ActivityLog orSearchWhereHas(string $relation, array|string $columns, string $searchPrefix = '')
 * @method static Builder<static>|ActivityLog orWhereInFromRequest(string $requestKey, ?string $databaseField = null, ?mixed $default = null)
 * @method static Builder<static>|ActivityLog query()
 * @method static Builder<static>|ActivityLog search(array|string $columns, string $searchPrefix = '')
 * @method static Builder<static>|ActivityLog searchWhereHas(string $relation, array|string $columns, string $searchPrefix = '')
 * @method static Builder<static>|ActivityLog sortFromRequest(string $sortKey = 'sort', string $orderKey = 'order', array $onlyByFields = [], string $table = '')
 * @method static Builder<static>|ActivityLog sortRelationshipFromRequest(string $relationship, string $relatedKey, string $sortKey = 'sort', string $orderKey = 'order')
 * @method static Builder<static>|ActivityLog validIn(int $timePeriod, string $column = 'created_at', ?\App\Enums\TimeUnit $timeUnit = null)
 * @method static Builder<static>|ActivityLog whereBatchUuid($value)
 * @method static Builder<static>|ActivityLog whereCauserId($value)
 * @method static Builder<static>|ActivityLog whereCauserType($value)
 * @method static Builder<static>|ActivityLog whereCreatedAt($value)
 * @method static Builder<static>|ActivityLog whereDescription($value)
 * @method static Builder<static>|ActivityLog whereEvent($value)
 * @method static Builder<static>|ActivityLog whereId($value)
 * @method static Builder<static>|ActivityLog whereLike(string $column, string $value = '')
 * @method static Builder<static>|ActivityLog whereLogName($value)
 * @method static Builder<static>|ActivityLog whereLoggableName($value)
 * @method static Builder<static>|ActivityLog whereProperties($value)
 * @method static Builder<static>|ActivityLog whereSubjectId($value)
 * @method static Builder<static>|ActivityLog whereSubjectType($value)
 * @method static Builder<static>|ActivityLog whereUpdatedAt($value)
 * @mixin Eloquent
 */
class ActivityLog extends SpatieActivity
{
    use Filterable;

    // Scopes
    public function scopeForSubjectType(Builder|self $query, ?LogSubjectType $subjectType): Builder|self
    {
        if (! $subjectType) {
            return $query;
        }

        return $query->whereSubjectType($subjectType->identifier());
    }

    // Attributes
    protected function eventType(): Attribute
    {
        return Attribute::make(
            get: fn (): LogEventType => LogEventType::fromString($this->event)
        );
    }

    protected function message(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->event_type->message(
                logSubjectType: LogSubjectType::fromIdentifier($this->subject_type),
                subjectName: $this->loggable_name
            )
        );
    }
}

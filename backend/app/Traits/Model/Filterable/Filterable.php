<?php

namespace App\Traits\Model\Filterable;

use App\Enums\TimeUnit;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;

/**
 * Filters data on multiple levels using Eloquent scopes on any model.
 */
trait Filterable
{
    use Searchable;
    use Sortable;

    /**
     * Filters data using LIKE operator inside database.
     *
     * @param Builder $query
     * @param string|array $columns
     * @param string|null $filter
     *
     * @return Builder
     */
    public function scopeFilter(Builder $query, string|array $columns, ?string $filter = ''): Builder
    {
        return $this->filterQuery(query: $query, columns: $columns, filter: $filter);
    }

    /**
     * Filters data using LIKE operator inside database but for related entities.
     *
     * @param Builder $query
     * @param string $relation
     * @param string|array $columns
     * @param string|null $filter
     *
     * @return Builder
     */
    public function scopeFilterWhereHas(Builder $query, string $relation, string|array $columns, ?string $filter = ''): Builder
    {
        return $query->whereHas($relation, function ($query) use ($columns, $filter) {
            return $this->filterQuery(query: $query, columns: $columns, filter: $filter);
        });
    }

    /**
     * Filters data using LIKE operator inside database but for related entities but add OR WHERE operator instead of plain WHERE.
     *
     * @param Builder $query
     * @param string $relation
     * @param string|array $columns
     * @param string|null $filter
     *
     * @return Builder
     */
    public function scopeOrFilterWhereHas(
        Builder      $query,
        string       $relation,
        string|array $columns,
        ?string      $filter = ''
    ): Builder
    {
        return $query->orWhereHas($relation, function ($query) use ($columns, $filter) {
            return $this->filterQuery(query: $query, columns: $columns, filter: $filter);
        });
    }

    /**
     * Scope which filters data from request data directly.
     *
     * @param Builder $query
     * @param string $requestKey
     * @param string $operator
     * @param mixed|null $default
     * @param string|null $databaseField
     *
     * @return Builder
     */
    public function scopeFilterFromRequest(
        Builder $query,
        string  $requestKey,
        string  $operator = '=',
        mixed   $default = null,
        ?string $databaseField = null
    ): Builder
    {
        if (! request($requestKey, $default)) {
            return $query;
        }

        $value = $this->getValueForOperator(requestKey: $requestKey, operator: $operator, default: $default);

        return $query->where($databaseField ?: $requestKey, $operator, $value);
    }

    /**
     * Scope which filters data from request data directly using OR WHERE constraint.
     *
     * @param Builder $query
     * @param string $requestKey
     * @param string $operator
     * @param mixed|null $default
     * @param string|null $databaseField
     *
     * @return Builder
     */
    public function scopeOrFilterFromRequest(
        Builder $query,
        string  $requestKey,
        string  $operator = '=',
        mixed   $default = null,
        ?string $databaseField = null
    ): Builder
    {
        if (! request($requestKey, $default)) {
            return $query;
        }

        $value = $this->getValueForOperator(requestKey: $requestKey, operator: $operator, default: $default);

        return $query->orWhere($databaseField ?: $requestKey, $operator, $value);
    }

    /**
     * Scope which filters any enum field from request.
     *
     * @param Builder $query
     * @param string $enumClass Fully qualified enum class name
     * @param string|null $requestKey Key to look for in request (defaults to snake_case of database field)
     * @param string|null $databaseField Database column name (defaults to request key)
     * @param string|null $altRequestKey Alternative request key to check if primary key is not found
     * @return Builder
     */
    public function scopeFilterEnumFromRequest(
        Builder $query,
        string  $enumClass,
        ?string $requestKey = null,
        ?string $databaseField = null,
        ?string $altRequestKey = null
    ): Builder
    {
        // Validate enum class exists
        if (! enum_exists($enumClass)) {
            throw new \InvalidArgumentException("Class {$enumClass} is not a valid enum");
        }

        $requestKey = $requestKey ?? $databaseField;

        $value = request($requestKey, $altRequestKey ?: null);

        if (! $value) {
            return $query;
        }

        if (! in_array($value, $enumClass::values())) {
            return $query;
        }

        $databaseField = $databaseField ?? $requestKey;

        return $query->where($databaseField, '=', $value);
    }

    /**
     * Scope which filters data from request data directly using WHERE constraint but works only with bool values.
     * All request parameters are string, therefore we explicitly need this scope to filter bool values ONLY.
     *
     * @param Builder $query
     * @param string $requestKey
     * @param mixed $default
     * @param string|null $databaseField
     *
     * @return Builder
     */
    public function scopeFilterBoolFromRequest(
        Builder $query,
        string  $requestKey,
        mixed   $default = false,
        ?string $databaseField = null
    ): Builder
    {
        if (! request()->has($requestKey) || is_null(request($requestKey, $default))) {
            return $query;
        }

        return $query->where(
            $databaseField ?: $requestKey,
            '=',
            request()->boolean($requestKey, $default)
        );
    }

    /**
     * Scope which filters if data exists on the model.
     *
     * @param Builder $query
     * @param string $requestKey
     * @param string|null $databaseField
     * @param mixed $default
     *
     * @return Builder
     */
    public function scopeFilterExistsFromRequest(
        Builder $query,
        string  $requestKey,
        ?string $databaseField = null,
        mixed   $default = false,
    ): Builder
    {
        if (! request()->has($requestKey) || is_null(request($requestKey, $default))) {
            return $query;
        }

        if (request()->boolean($requestKey, $default)) {
            return $query->whereNotNull($databaseField ?: $requestKey);
        }

        return $query->whereNull($databaseField ?: $requestKey);
    }

    /**
     * Scope which filters data from request data directly using WHERE IN operator.
     *
     * @param Builder $query
     * @param string $requestKey
     * @param string|null $databaseField
     * @param mixed|null $default
     *
     * @return Builder
     */
    public function scopeFilterWhereInFromRequest(
        Builder $query,
        string  $requestKey,
        ?string $databaseField = null,
        mixed   $default = null
    ): Builder
    {
        $requestData = request($requestKey, $default);

        if (! $requestData || $requestData === config('request.fetch_all_records_key')) {
            return $query;
        }

        $values = is_array($requestData)
            ? $requestData
            : explode(',', $requestData);

        return $query->whereIn($databaseField ?: $requestKey, $values);
    }

    /**
     * Scope which filters data from request data directly using OR WHERE IN operator.
     *
     * @param Builder $query
     * @param string $requestKey
     * @param string|null $databaseField
     * @param mixed|null $default
     *
     * @return Builder
     */
    public function scopeOrWhereInFromRequest(
        Builder $query,
        string  $requestKey,
        ?string $databaseField = null,
        mixed   $default = null,
    ): Builder
    {
        $requestData = request($requestKey, $default);

        if (! $requestData || $requestData === config('request.fetch_all_records_key')) {
            return $query;
        }

        $values = is_array($requestData)
            ? $requestData
            : explode(',', $requestData);

        return $query->orWhereIn($databaseField ?: $requestKey, $values);
    }

    /**
     * Scope which filters data directly from request data but on the related entities.
     *
     * @param Builder $query
     * @param string $relation
     * @param string $requestKey
     * @param string|null $databaseField
     * @param string $operator
     *
     * @param mixed|null $default
     *
     * @return Builder
     */
    public function scopeFilterWhereHasFromRequest(
        Builder $query,
        string  $relation,
        string  $requestKey,
        ?string $databaseField = null,
        string  $operator = '=',
        mixed   $default = null
    ): Builder
    {
        if (! request($requestKey, $default)) {
            return $query;
        }

        $value = $this->getValueForOperator(requestKey: $requestKey, operator: $operator, default: $default);

        return $query->whereHas($relation, fn ($query) => $query->where($databaseField ?: $requestKey, $operator, $value));
    }

    /**
     * Scope which filters data from request data directly using WHERE IN operator for given relationship.
     *
     * @param Builder $query
     * @param string $relation
     * @param string $requestKey
     * @param string|null $databaseField
     * @param mixed|null $default
     *
     * @return Builder
     */
    public function scopeFilterWhereHasInFromRequest(
        Builder $query,
        string  $relation,
        string  $requestKey,
        ?string $databaseField = null,
        mixed   $default = null
    ): Builder
    {
        $requestData = request($requestKey, $default);

        if (! $requestData || $requestData === config('request.fetch_all_records_key')) {
            return $query;
        }

        $values = is_array($requestData)
            ? $requestData
            : explode(',', $requestData);

        return $query->whereHas($relation, fn ($query) => $query->whereIn($databaseField ?: $requestKey, $values));
    }

    /**
     * Scope which filters data from request data directly using OR WHERE IN operator for given relationship.
     *
     * @param Builder $query
     * @param string $relation
     * @param string $requestKey
     * @param string|null $databaseField
     * @param mixed|null $default
     *
     * @return Builder
     */
    public function scopeFilterOrWhereHasInFromRequest(
        Builder $query,
        string  $relation,
        string  $requestKey,
        ?string $databaseField = null,
        mixed   $default = null
    ): Builder
    {
        $requestData = request($requestKey, $default);

        if (! $requestData || $requestData === config('request.fetch_all_records_key')) {
            return $query;
        }

        $values = is_array($requestData)
            ? $requestData
            : explode(',', $requestData);

        return $query->orWhereHas($relation, fn ($query) => $query->whereIn($databaseField ?: $requestKey, $values));
    }

    /**
     * Scope which filters data from request data directly using json contains.
     *
     * @param Builder $query
     * @param string $requestKey
     * @param mixed|null $default
     * @param string|null $databaseField
     *
     * @return Builder
     */
    public function scopeFilterJsonContainsFromRequest(
        Builder $query,
        string  $requestKey,
        mixed   $default = null,
        ?string $databaseField = null
    ): Builder
    {
        $value = request($requestKey, $default);

        if (! $value) {
            return $query;
        }

        $value = is_numeric($value) ? (int) $value : $value;

        return $query->whereJsonContains($databaseField ?: $requestKey, $value);
    }

    /**
     * Filters data based on the range provided in the request.
     *
     * @param Builder $query
     * @param string $column
     * @param string|null $requestKey
     *
     * @return Builder
     */
    public function scopeFilterBetweenFromRequest(
        Builder $query,
        string  $column,
        ?string $requestKey = null,
    ): Builder
    {
        $requestKey ??= $column;

        $fromValue = request("{$requestKey}_from");
        $toValue = request("{$requestKey}_to");

        if (! $fromValue && ! $toValue) {
            return $query;
        }

        if (! $fromValue) {
            return $query->where($column, '<=', $toValue);
        }

        if (! $toValue) {
            return $query->where($column, '>=', $fromValue);
        }

        return $query->whereBetween($column, [$fromValue, $toValue]);
    }

    /**
     * If dates are provided will filter data based on them and retrieve results in between those two days.
     *
     * @param Builder $query
     * @param CarbonInterface|null $dateFrom
     * @param CarbonInterface|null $dateTo
     * @param string $dateColumn
     *
     * @return Builder
     */
    public function scopeConditionallyFilterDateBetween(
        Builder          $query,
        ?CarbonInterface $dateFrom = null,
        ?CarbonInterface $dateTo = null,
        string           $dateColumn = 'created_at',
    ): Builder
    {
        if (! $dateFrom && ! $dateTo) {
            return $query;
        }

        if (! $dateFrom) {
            return $query->where($dateColumn, '<=', $dateTo);
        }

        if (! $dateTo) {
            return $query->where($dateColumn, '>=', $dateFrom);
        }

        return $query->whereBetween($dateColumn, [$dateFrom, $dateTo]);
    }

    /**
     * If dates are provided will filter data based on them and retrieve results in between two months periods.
     *
     * @param Builder $query
     * @param CarbonInterface|null $dateFrom
     * @param CarbonInterface|null $dateTo
     * @param string $dateColumn
     *
     * @return Builder
     */
    public function scopeConditionallyFilterDateBetweenByMonth(
        Builder          $query,
        ?CarbonInterface $dateFrom = null,
        ?CarbonInterface $dateTo = null,
        string           $dateColumn = 'created_at',
    ): Builder
    {
        if (! $dateFrom && ! $dateTo) {
            return $query;
        }

        if (! $dateFrom) {
            return $query->whereMonth($dateColumn, '<=', $dateTo)
                         ->whereYear($dateColumn, '<=', $dateTo);
        }

        if (! $dateTo) {
            return $query->whereMonth($dateColumn, '>=', $dateFrom)
                         ->whereYear($dateColumn, '>=', $dateTo);
        }

        return $query->where(
            fn (Builder $query) => $query
                ->whereYear($dateColumn, '<=', $dateTo)
                ->whereMonth($dateColumn, '<=', $dateTo)

        )->when(
            $dateFrom->year < $dateTo->year,
            fn (Builder $query) => $query->where($dateColumn, '>=', $dateFrom),
            fn (Builder $query) => $query->whereMonth($dateColumn, '>=', $dateFrom)
        );
    }

    /**
     * Filters all records that are valid in a specified time period from now.
     *
     * @param Builder $query
     * @param int $timePeriod
     * @param string $column
     * @param TimeUnit|null $timeUnit
     *
     * @return Builder
     */
    public function scopeValidIn(
        Builder   $query,
        int       $timePeriod,
        string    $column = 'created_at',
        ?TimeUnit $timeUnit = null
    ): Builder
    {
        $timeUnit ??= TimeUnit::SECOND;

        return $query->whereRaw(
            "DATE_ADD({$column}, INTERVAL {$timePeriod} {$timeUnit->value}) > ?",
            [now()]
        );
    }

    public function scopeActive(Builder $query, string $column = 'is_active'): Builder
    {
        return $query->where($column, true);
    }

    public function scopeWhereLike(Builder $query, string $column, string $value = ''): Builder
    {
        return $query->where($column, 'LIKE', $value);
    }

    public function scopeForAuthUser(Builder $query, string $column = 'user_id'): Builder
    {
        return $query->where($column, auth()->id());
    }

    /**     * Helpers *     */

    /**
     * Underlying filter method which is doing all the filtering and where statement grouping.
     *
     * @param Builder $query
     * @param string|array $columns
     * @param string|null $filter
     *
     * @return Builder
     */
    private function filterQuery(Builder $query, string|array $columns, ?string $filter = ''): Builder
    {
        if (is_string($columns)) {
            return $query->where($columns, 'LIKE', "%{$filter}%");
        }

        // First column must be plain WHERE clause and not OR WHERE that is why it is outside the loop
        $query = $query->where($columns[0], 'LIKE', "%{$filter}%");

        // Here we get all other columns except first one
        foreach (array_slice($columns, 1) as $column) {
            $query = $query->orWhere($column, 'LIKE', "%{$filter}%");
        }

        return $query;
    }

    private function getValueForOperator(string $requestKey, string $operator = '=', mixed $default = null): mixed
    {
        return strtolower($operator) === 'like'
            ? '%' . request($requestKey, $default) . '%'
            : request($requestKey, $default);
    }
}

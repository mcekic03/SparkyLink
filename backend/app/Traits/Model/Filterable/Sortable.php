<?php

namespace App\Traits\Model\Filterable;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Schema;

/**
 * Sorts data on multiple levels using Eloquent scopes on any model.
 */
trait Sortable
{
    /**
     * Scope which sorts data directly from request data.
     *
     * @param Builder $query
     * @param string $sortKey
     * @param string $orderKey
     * @param array $onlyByFields
     * @param string $table
     * @return Builder
     */
    public function scopeSortFromRequest(
        Builder $query,
        string  $sortKey = 'sort',
        string  $orderKey = 'order',
        array   $onlyByFields = [],
        string  $table = '',
    ): Builder
    {
        $sort = request($sortKey);
        $order = request_order($orderKey);

        if (! $sort) {
            return $query;
        }

        if (! empty($onlyByFields) && ! in_array($sort, $onlyByFields)) {
            return $query;
        }

        if (! in_array($sort, Schema::connection($this->connection)->getColumnListing($this->getTable()))) {
            return $query;
        }

        if ($table) {
            $sort = "{$table}.{$sort}";
        }

        return $query->orderBy($sort, $order);
    }

    /**
     * Scope which sorts relationship data directly from request data.
     *
     * @param Builder $query
     * @param string $relationship
     * @param string $relatedKey
     * @param string $sortKey
     * @param string $orderKey
     *
     * @return Builder
     */
    public function scopeSortRelationshipFromRequest(
        Builder $query,
        string  $relationship,
        string  $relatedKey,
        string  $sortKey = 'sort',
        string  $orderKey = 'order',
    ): Builder
    {
        $sort = request($sortKey);

        if (! $sort) {
            return $query;
        }

        if (! str_starts_with($sort, "{$relationship}.")) {
            return $query;
        }

        $parentTable = $query->getModel()->getTable();
        $relatedModel = $query->getRelation($relationship)->getModel();
        $relatedTable = $relatedModel->getTable();
        $sortColumn = explode('.', $sort)[1];

        if (! in_array($sortColumn, Schema::connection($this->connection)->getColumnListing($relatedTable))) {
            return $query;
        }

        return $query->orderBy(
            $relatedModel::query()
                         ->select($sortColumn)
                         ->whereColumn("{$relatedTable}.id", "{$parentTable}.{$relatedKey}"),
            request_order($orderKey)
        );
    }

    /**
     * Scope which sorts initially if no sort request was provided.
     *
     * @param Builder|Sortable $query
     * @param string $sortKey
     * @return Builder|User|ActivityLog|Sortable
     */
    public function scopeInitialSort(Builder|self $query, string $sortKey = 'sort'): Builder|self
    {
        if (request()->filled($sortKey)) {
            return $query;
        }

        return $query->orderByDesc('id');
    }
}

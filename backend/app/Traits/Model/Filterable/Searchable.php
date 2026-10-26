<?php

namespace App\Traits\Model\Filterable;

use Illuminate\Database\Eloquent\Builder;

trait Searchable
{
    /**
     * Filters data by specified columns using LIKE operator inside database but only for 'search' query param.
     *
     * @param Builder $query
     * @param string|array $columns
     * @param string $searchPrefix
     * @return Builder
     */
    public function scopeSearch(Builder $query, string|array $columns, string $searchPrefix = ''): Builder
    {
        $searchKey = $this->searchKey($searchPrefix);

        if (! request($searchKey)) {
            return $query;
        }

        return $this->filterQuery(query: $query, columns: $columns, filter: request($searchKey));
    }

    /**
     * Filters data by specified columns using LIKE operator inside database for related entities, but only for 'search' query param.
     *
     * @param Builder $query
     * @param string $relation
     * @param string|array $columns
     * @param string $searchPrefix
     * @return Builder
     */
    public function scopeSearchWhereHas(Builder $query, string $relation, string|array $columns, string $searchPrefix = ''): Builder
    {
        $searchKey = $this->searchKey($searchPrefix);

        if (! request($searchKey)) {
            return $query;
        }

        return $query->whereHas(
            $relation,
            fn ($query) => $this->filterQuery(query: $query, columns: $columns, filter: request($searchKey))
        );
    }

    /**
     * Filters data by specified columns using LIKE operator inside database for related entities,
     * but adds OR WHERE operator instead of plain WHERE, but only for 'search' query param.
     *
     * @param Builder $query
     * @param string $relation
     * @param string|array $columns
     * @param string $searchPrefix
     * @return Builder
     */
    public function scopeOrSearchWhereHas(Builder $query, string $relation, string|array $columns, string $searchPrefix = ''): Builder
    {
        $searchKey = $this->searchKey($searchPrefix);

        if (! request($searchKey)) {
            return $query;
        }

        return $query->orWhereHas(
            $relation,
            fn ($query) => $this->filterQuery(query: $query, columns: $columns, filter: request($searchKey))
        );
    }

    private function searchKey(string $searchPrefix): string
    {
        $searchKey = 'search';

        if ($searchPrefix) {
            $searchKey = str_ends_with($searchPrefix, '_')
                ? $searchPrefix . $searchKey
                : $searchPrefix . '_' . $searchKey;
        }

        return $searchKey;
    }
}

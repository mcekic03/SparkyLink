<?php

namespace App\Traits\Model;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Additional functionality for models that use soft deletes.
 */
trait HasSoftDeletes
{
    public function scopeWithThrashed(Builder $query, string|array $relationship): Builder
    {
        $callback = fn ($query) => $query->withTrashed();

        if (is_string($relationship)) {
            return $query->with([$relationship => $callback]);
        }

        return $query->with(
            $this->loadTrashedForEachRelationship($relationship, $callback)
        );
    }

    public function loadTrashed(string|array $relationship): Model
    {
        $callback = fn ($query) => $query->withTrashed();

        if (is_string($relationship)) {
            return $this->load([$relationship => $callback]);
        }

        return $this->load(
            $this->loadTrashedForEachRelationship($relationship, $callback)
        );
    }

    private function loadTrashedForEachRelationship(array $relationships, callable $callback): array
    {
        return collect($relationships)->reduce(function (array $carry, string $item) use ($callback) {
            $carry[$item] = $callback;

            return $carry;
        }, []);
    }
}

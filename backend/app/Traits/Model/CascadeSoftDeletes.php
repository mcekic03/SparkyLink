<?php

namespace App\Traits\Model;

use App\Exceptions\SoftDeletes\InvalidSoftDeletesRelationshipsException;
use App\Exceptions\SoftDeletes\SoftDeletesNotImplementedException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;

trait CascadeSoftDeletes
{
    protected static function bootCascadeSoftDeletes(): void
    {
        static::deleting(function (Model $model) {
            $model->validateCascadingSoftDelete();

            $model->runCascadingSoftDeletes();
        });
    }

    /**
     * Checks whether soft deletes are present and whether all relationships are valid.
     *
     * @throws SoftDeletesNotImplementedException
     * @throws InvalidSoftDeletesRelationshipsException
     */
    protected function validateCascadingSoftDelete(): void
    {
        if (! $this->implementsSoftDeletes()) {
            throw new SoftDeletesNotImplementedException(get_called_class());
        }

        if ($invalidCascadingRelationships = $this->hasInvalidCascadingRelationships()) {
            throw new InvalidSoftDeletesRelationshipsException($invalidCascadingRelationships);
        }
    }

    /**
     * Determine if the current model implements soft deletes.
     *
     * @return bool
     */
    protected function implementsSoftDeletes(): bool
    {
        return method_exists($this, 'runSoftDelete');
    }

    /**
     * Determine if the current model has any invalid cascading relationships defined.
     *
     * A relationship is considered invalid when the method does not exist, or the relationship
     * method does not return an instance of Illuminate\Database\Eloquent\Relations\Relation.
     *
     * @return array
     */
    protected function hasInvalidCascadingRelationships(): array
    {
        return array_filter($this->getCascadingSoftDeletes(), function ($relationship) {
            return ! method_exists($this, $relationship) || ! $this->{$relationship}() instanceof Relation;
        });
    }

    /**
     * Run the cascading soft deleting for this model.
     *
     * @return void
     */
    protected function runCascadingSoftDeletes(): void
    {
        foreach ($this->getActiveCascadingSoftDeletes() as $relationship) {
            $this->cascadeSoftDeletes($relationship);
        }
    }

    /**
     * For the cascading deleting defined on the model, return only those that are not null.
     *
     * @return array
     */
    protected function getActiveCascadingSoftDeletes(): array
    {
        return array_filter($this->getCascadingSoftDeletes(), function ($relationship) {
            return $this->{$relationship}()->exists();
        });
    }

    /**
     * Fetch the defined cascading soft deleting for this model.
     *
     * @return array
     */
    protected function getCascadingSoftDeletes(): array
    {
        return $this->cascadeSoftDeletes ?? [];
    }

    /**
     * Cascade deletes the given relationship on the given mode.
     *
     * @param string $relationship
     *
     * @return void
     */
    protected function cascadeSoftDeletes(string $relationship): void
    {
        $deleteMethod = $this->isForceDeleting() ? 'forceDelete' : 'delete';

        // Iterating over each model so that their cascading deletes are triggered as well
        foreach ($this->{$relationship}()->get() as $model) {
            isset($model->pivot) ? $model->pivot->{$deleteMethod}() : $model->{$deleteMethod}();
        }
    }
}

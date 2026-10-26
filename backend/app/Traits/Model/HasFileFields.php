<?php

namespace App\Traits\Model;

use App\Exceptions\MissingParameterException;
use App\Models\Media;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Support\Facades\File;
use Str;

/**
 * Adds functionality to delete files when deleting a model.
 */
trait HasFileFields
{
    /**
     * Before permanently deleting a model which has files we remove those files from the system.
     *
     * @throws MissingParameterException
     */
    protected static function bootHasFileFields(): void
    {
        static::deleting(function (Model $model) {
            if (method_exists($model, 'runSoftDelete') && ! $model->isForceDeleting()) {
                return;
            }

            $model->clearFiles();
        });
    }

    private function clearFiles(): void
    {
        foreach ($this->getCascadeFileFields() as $field) {
            // If the field exists on the model and is null, we skip it because there is no file set.
            if (array_key_exists($field, $this->getAttributes()) && ! $this->$field) {
                continue;
            }

            // Safety checks before actually deleting file.
            if (is_array($this->$field) && array_key_exists('path', $this->$field)) {
                File::delete($this->$field['path']);
            }
        }

        // Now if the method media exists, we know it is a one-to-many polymorphic relationship with a Media model.
        // And we need to delete each file separately.
        if (method_exists($this, 'media') && $this->media() instanceof MorphMany) {
            $this->media()->select('id', 'path')->get()->each(fn (Media $media) => $media->delete());
            $this->media()->delete();
        }
    }

    public function getCascadeFileFields(): array
    {
        return collect($this->getCasts())
            ->filter(fn (mixed $item) => $item === \App\Casts\File::class)
            ->keys()
            ->toArray();
    }

    public function getMediaStorageSubdirectory(): string
    {
        return property_exists(static::class, 'storeDir')
            ? $this->storeDir
            : Str::of(__CLASS__)->classBasename()->plural()->snake('-')->value;
    }
}

<?php

namespace App\Traits\Core;

use App\Enums\MediaType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\File;

trait Mediable
{
    protected static function bootMediable(): void
    {
        static::deleting(function (Model $model) {
            if (! $model->path) {
                return;
            }

            File::delete($model->path);
        });
    }

    public function scopeImages(Builder $query): Builder
    {
        return $query->where('type', MediaType::IMAGE);
    }

    public function scopeVideos(Builder $query): Builder
    {
        return $query->where('type', MediaType::VIDEO);
    }

    public function isImage(): bool
    {
        return $this->type === MediaType::IMAGE;
    }

    public function isVideo(): bool
    {
        return $this->type === MediaType::VIDEO;
    }

    protected function path(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => public_storage_path($value),
        );
    }

    protected function url(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => storage_url($value),
        );
    }
}

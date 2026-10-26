<?php

namespace App\Traits\Model\Filterable;

use Illuminate\Support\Collection;

trait HasColumns
{
    protected Collection $columns;

    public static function columns(): self
    {
        $self = (new self);

        $self->columns = collect($self->getFillable());

        return $self;
    }

    public function exceptColumns(...$columns): self
    {
        $this->columns = $this->columns->diff($columns);

        return $this;
    }

    public function onlyColumns(array $columns): self
    {
        $this->columns = $this->columns->only($columns);

        return $this;
    }

    public function addColumns(...$columns): self
    {
        $this->columns = $this->columns->merge($columns);

        return $this;
    }

    public function getColumns(): array
    {
        return $this->columns->toArray();
    }
}

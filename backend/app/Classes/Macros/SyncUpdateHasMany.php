<?php

namespace App\Classes\Macros;

use App\Classes\Abstracts\Makeable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Throwable;

class SyncUpdateHasMany extends Makeable
{
    private readonly string $keyName;

    private readonly Collection $recordsToUpdate;

    private readonly Collection $recordsToCreate;

    public function __construct(private readonly HasMany $query, iterable $records)
    {
        $records = collect($records);

        $this->keyName = $query->getRelated()->getKeyName();
        $this->recordsToUpdate = $records->filter(fn (iterable $record) => ! empty($record[$this->keyName]));
        $this->recordsToCreate = $records->filter(fn (iterable $record) => empty($record[$this->keyName]))
                                         ->map(fn (iterable $record) => Arr::except($record, $this->keyName));
    }

    /**
     * @throws Throwable
     */
    public function handle(bool $force = false): void
    {
        if ($force) {
            $this->query->getRelated()->unguarded(fn () => $this->synchronize());

            return;
        }

        $this->synchronize();
    }

    /**
     * @throws Throwable
     */
    private function synchronize(): void
    {
        transact(function () {
            $this->deleteMissingRecords();
            $this->updateExistingRecords();
            $this->createNewRecords();
        });
    }

    private function freshQuery(): HasMany
    {
        return clone $this->query;
    }

    private function deleteMissingRecords(): void
    {
        $this->freshQuery()
             ->whereNotIn($this->keyName, $this->recordsToUpdate->pluck($this->keyName))
             ->delete();
    }

    private function createNewRecords(): void
    {
        $this->freshQuery()->createMany($this->recordsToCreate->all());
    }

    private function updateExistingRecords(): void
    {
        $this->recordsToUpdate->each(
            fn (iterable $record) => $this->freshQuery()
                                          ->where($this->keyName, $record[$this->keyName])
                                          ->update(Arr::except($record, $this->keyName))
        );
    }
}

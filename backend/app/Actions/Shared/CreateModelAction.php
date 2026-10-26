<?php

namespace App\Actions\Shared;

use App\Traits\Core\WorksWithFiles;
use Illuminate\Database\Eloquent\Model;

class CreateModelAction
{
    use WorksWithFiles;

    public function handle(string $modelClass, array $validatedData, ?bool $force = false): Model
    {
        $validatedData = array_merge(
            $validatedData,
            $this->storeFilesAndGetData(model: $modelClass, data: $validatedData)
        );

        if ($force) {
            // When force filling all fields from request are included in DB SQL query, sometimes additional
            // fields are sent from frontend and these do not exist inside DB, they are only helper fields
            // which give additional info and context, to prevent unhandled errors we remove those before persisting
            $this->discardFileDataFields($modelClass, $validatedData);

            return $modelClass::forceCreate($validatedData);
        }

        return $modelClass::create($validatedData);
    }
}

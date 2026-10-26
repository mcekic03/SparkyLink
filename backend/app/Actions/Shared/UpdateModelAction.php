<?php

namespace App\Actions\Shared;

use App\Traits\Core\WorksWithFiles;
use Illuminate\Database\Eloquent\Model;

class UpdateModelAction
{
    use WorksWithFiles;

    public function handle(Model $model, array $validatedData, ?bool $force = false): Model
    {
        $validatedData = array_merge(
            $validatedData,
            $this->updateFilesAndGetData(model: $model, data: $validatedData)
        );

        if ($force) {
            // When force filling all fields from request are included in DB SQL query, sometimes additional
            // fields are sent from frontend and these do not exist inside DB, they are only helper fields
            // which give additional info and context, to prevent unhandled errors we remove those before persisting
            $this->discardFileDataFields($model, $validatedData);

            $model->forceFill($validatedData)->save();
        } else {
            $model->update($validatedData);
        }

        return $model;
    }
}

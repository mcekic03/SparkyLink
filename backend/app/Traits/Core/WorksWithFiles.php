<?php

namespace App\Traits\Core;

use App\Actions\Shared\ProcessFileAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\File;

trait WorksWithFiles
{
    /**
     * Adds new files. Also prepares array of information about files added ready to be persisted for a model.
     *
     * @param Model|string $model
     * @param array $data
     * @param bool $asJsonEncodedString
     *
     * @return array
     */
    protected function storeFilesAndGetData(Model|string $model, array $data, bool $asJsonEncodedString = false): array
    {
        $model = is_string($model) ? new $model : $model;

        if (! $this->modelHasFileFields($model)) {
            return [];
        }

        return $this->processIncomingFiles($model, $data, $asJsonEncodedString);
    }

    /**
     * Removes existing and adds new files if there are any new files. Also prepares array of information about
     * files added ready to be persisted for a model.
     *
     * @param Model $model
     * @param array $data
     *
     * @return array
     */
    protected function updateFilesAndGetData(Model $model, array $data): array
    {
        if (! $this->modelHasFileFields($model)) {
            return [];
        }

        return $this->processIncomingFiles(model: $model, requestData: $data, checkForDeletes: true);
    }

    /**
     * Does all heavy lifting for deleting/creating new files and collecting all needed data.
     *
     * @param Model $model
     * @param array $requestData
     * @param bool $asJsonEncodedString
     * @param bool $checkForDeletes
     *
     * @return array
     */
    private function processIncomingFiles(
        Model $model,
        array $requestData,
        bool  $asJsonEncodedString = false,
        bool  $checkForDeletes = false
    ): array
    {
        $filesData = [];
        $subDir = $model->getMediaStorageSubdirectory();

        foreach ($model->getCascadeFileFields() as $fileColumn) {
            if (
                $checkForDeletes &&
                $this->fileShouldBeDeleted(file: $model->$fileColumn, data: $requestData, fileColumn: $fileColumn)
            ) {
                File::delete($model->$fileColumn['path']);

                $filesData[$fileColumn] = null;
            }

            if (! array_key_exists(key: $fileColumn, array: $requestData)) {
                continue;
            }

            $processedFile = ProcessFileAction::make()->handle(file: $requestData[$fileColumn], subDir: $subDir);

            $filesData[$fileColumn] = $asJsonEncodedString
                ? json_encode($processedFile)
                : $processedFile;
        }

        return $filesData;
    }

    /**
     * Checks whether file should be removed.
     *
     * @param array|string|null $file
     * @param array $data
     * @param string $fileColumn
     *
     * @return bool
     */
    private function fileShouldBeDeleted(null|array|string $file, array $data, string $fileColumn): bool
    {
        $data = optional($data);

        if (! $file || is_string($file) || ! array_key_exists('path', $file)) {
            return false;
        }

        $fileExists = $file && $file['path'];
        $newFileUploaded = $data[$fileColumn];
        $fileDataKey = "{$fileColumn}_data";
        $requestsFileDeletion = optional($data[$fileDataKey])['delete'];

        return $fileExists && ($newFileUploaded || $requestsFileDeletion);
    }

    /**
     * Discards data fields sent from frontend used in combination with file fields to provide more data.
     * This is useful with forceFill and forceCreate because they do not discard attributes that are not fillable.
     *
     * @param Model|string $model
     * @param array $validatedData
     *
     * @return void
     */
    protected function discardFileDataFields(Model|string $model, array &$validatedData): void
    {
        $model = is_string($model) ? new $model : $model;

        if (! $this->modelHasFileFields($model)) {
            return;
        }

        foreach ($model->getCascadeFileFields() as $fileColumn) {
            unset($validatedData["{$fileColumn}_data"]);
        }
    }

    /**
     * Checks whether class has file fields.
     *
     * @param Model $model
     *
     * @return bool
     */
    private function modelHasFileFields(Model $model): bool
    {
        if (! method_exists($model, 'getCascadeFileFields')) {
            return false;
        }

        return ! empty($model->getCascadeFileFields());
    }
}

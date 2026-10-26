<?php

use App\Actions\Shared\ProcessFileAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

if (! function_exists('random_image')) {
    /**
     * Picks a random image from the seeder_assets/random directory and processes it.
     *
     * @param string $path
     * @param string $subDir
     * @return array
     */
    function random_image(string $path = 'uploads', string $subDir = ''): array
    {
        Config::set('image_intervention.scale_down_width', 500);
        Config::set('image_intervention.compress_quality', 50);

        $storageDisk = Storage::disk('seeder_assets');

        $randomFileName = collect(Storage::disk('seeder_assets')->files('random'))->random();
        $mime = $storageDisk->mimeType($randomFileName);

        $imageFile = new UploadedFile(
            $storageDisk->path($randomFileName),
            $randomFileName,
            $mime
        );

        $fileData = ProcessFileAction::make()->handle($imageFile, path: $path, subDir: $subDir);

        Config::set('image_intervention.scale_down_width', null);
        Config::set('image_intervention.compress_quality', 50);

        return [
            'type' => $fileData['type'],
            'url' => $fileData['url'],
            'path' => $fileData['path'],
            'name' => $fileData['name'],
            'size' => $fileData['size'],
            'extension' => $fileData['extension'],
            'width' => $fileData['width'],
            'height' => $fileData['height'],
        ];
    }
}

if (! function_exists('fake_avatar')) {
    /**
     * Picks a demo avatar image from the seeder_assets directory and processes it.
     *
     * @param string $path
     * @param string $subDir
     * @return array
     */
    function fake_avatar(string $path = 'uploads', string $subDir = ''): array
    {
        $fileName = 'profile.png';
        $mime = Storage::disk('seeder_assets')->mimeType($fileName);

        $imageFile = new UploadedFile(
            Storage::disk('seeder_assets')->path($fileName),
            $fileName,
            $mime
        );

        $fileData = ProcessFileAction::make()->handle($imageFile, path: $path, subDir: $subDir);

        return [
            'type' => $fileData['type'],
            'url' => $fileData['url'],
            'path' => $fileData['path'],
            'name' => $fileData['name'],
            'size' => $fileData['size'],
            'extension' => $fileData['extension'],
            'width' => $fileData['width'],
            'height' => $fileData['height'],
        ];
    }
}

if (! function_exists('random_model_id')) {
    /**
     * Checks whether number is between min and max values.
     *
     * @param string|Model $model
     * @param callable|null $query
     * @return int|null
     */
    function random_model_id(string|Model $model, ?callable $query = null): ?int
    {
        return $model::query()
                     ->when($query, $query)
                     ->inRandomOrder()
                     ->value('id');
    }
}

if (! function_exists('random_zip')) {
    /**
     * Picks a random image from the seeder_assets/random directory and processes it.
     *
     * @param string $path
     * @param string $subDir
     * @return array
     */
    function random_zip(string $path = 'uploads', string $subDir = ''): array
    {
        $file = UploadedFile::fake()->create(
            'software-package.zip',
            10240,
            'application/zip'
        );

        $fileData = ProcessFileAction::make()->handle($file, path: $path, subDir: $subDir);

        Config::set('image_intervention.scale_down_width', null);
        Config::set('image_intervention.compress_quality', 50);

        return [
            'type' => $fileData['type'],
            'url' => $fileData['url'],
            'path' => $fileData['path'],
            'name' => $fileData['name'],
            'size' => $fileData['size'],
            'extension' => $fileData['extension'],
        ];
    }
}

if (! function_exists('random_exe')) {
    /**
     * Picks a random image from the seeder_assets/random directory and processes it.
     *
     * @param string $path
     * @param string $subDir
     * @return array
     */
    function random_exe(string $path = 'uploads', string $subDir = ''): array
    {
        $file = UploadedFile::fake()->create(
            'installer.exe',
            5120, // size in kilobytes (5MB)
            'application/x-msdownload' // MIME type for .exe
        );

        $fileData = ProcessFileAction::make()->handle($file, path: $path, subDir: $subDir);

        Config::set('image_intervention.scale_down_width', null);
        Config::set('image_intervention.compress_quality', 50);

        return [
            'type' => $fileData['type'],
            'url' => $fileData['url'],
            'path' => $fileData['path'],
            'name' => $fileData['name'],
            'size' => $fileData['size'],
            'extension' => $fileData['extension'],
        ];
    }
}

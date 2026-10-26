<?php

namespace App\Actions\Shared;

use App\Classes\Utilities\VideoCompressor;
use App\Enums\MediaType;
use App\Jobs\CompressVideoJob;
use App\Traits\Core\AsAction;
use Illuminate\Filesystem\Filesystem;
use Illuminate\Http\UploadedFile;
use Intervention\Image\Laravel\Facades\Image;
use Psy\Readline\Hoa\FileDoesNotExistException;

class ProcessFileAction
{
    use AsAction;

    private readonly Filesystem $filesystem;

    public function __construct()
    {
        $this->filesystem = new Filesystem;
    }

    public function handle(?UploadedFile $file, string $path = 'uploads', ?string $subDir = null): ?array
    {
        if (! $file) {
            return null;
        }

        $uploadDir = $subDir ? "{$path}/{$subDir}" : $path;

        $type = MediaType::fromMimeType($file->getClientMimeType());

        $dimensions = [];

        if ($type === MediaType::IMAGE) {
            $path = $this->storeAndCompressImage($file, $uploadDir);

            $dimensions = $this->getImageDimensions($path);
        } else if ($type === MediaType::VIDEO) {
            $path = $this->storeAndCompressVideo($file, $uploadDir);
        } else {
            $path = $file->store($uploadDir, 'public');
        }

        return [
            'type' => $type,
            'path' => $path,
            'url' => $path,
            'name' => $file->getClientOriginalName(),
            'size' => format_file_size($file->getSize()),
            // Some devices generate an uppercase extension, this is just a safety measure
            'extension' => strtolower($file->getClientOriginalExtension()),
            ...$dimensions,
        ];
    }

    /**
     * Reduces image quality to 50%, therefore compressing its value close to tenfold.
     * ONLY works for JPEG images because PNG images are lossless.
     *
     * @param UploadedFile $file
     * @param string $uploadDir
     *
     * @return string
     */
    private function storeAndCompressImage(UploadedFile $file, string $uploadDir): string
    {
        $this->filesystem->ensureDirectoryExists(public_storage_path($uploadDir));

        // If the file is an octet-stream, it means that Laravel will save the file as .bin
        // To preserve the original extension, we will save file it manually
        if ($file->getClientMimeType() === 'application/octet-stream') {
            $relativePath = "$uploadDir/" . str()->random(40) . ".{$file->getClientOriginalExtension()}";
        } else {
            $relativePath = "$uploadDir/{$file->hashName()}";
        }

        $img = Image::read($file);

        if (config('image_intervention.scale_down_width') || config('image_intervention.scale_down_height')) {
            $img->scaleDown(
                config('image_intervention.scale_down_width'),
                config('image_intervention.scale_down_height')
            );
        }

        $img->save(public_storage_path($relativePath), quality: config('image_intervention.compress_quality'));

        return $relativePath;
    }

    private function storeAndCompressVideo(UploadedFile $file, string $uploadDir): string
    {
        ensure_dirs_exist(public_storage_path($uploadDir), public_storage_path('temp'));

        $relativePath = "$uploadDir/{$file->hashName()}";

        $tempStoragePath = $file->store('temp', 'public');

        dispatch(new CompressVideoJob(new VideoCompressor($tempStoragePath, $relativePath)));

        return $relativePath;
    }

    private function getImageDimensions(string $path): array
    {
        try {
            $dimensions = get_image_dimensions(public_storage_path($path));

            return [
                'width' => $dimensions->width,
                'height' => $dimensions->height,
            ];
        } catch (FileDoesNotExistException $ex) {
            return [];
        }
    }
}

<?php

namespace App\Actions\SiteMedia\Admin;

use App\Enums\MediaType;
use App\Models\Site;
use App\Models\SiteMedia;
use App\Traits\Core\AsAction;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Laravel\Facades\Image;
use Throwable;

class StoreSiteMediaAction
{
    use AsAction;

    /**
     * Cuva sliku ili video uz gradiliste (privatno). Slici pravi slicicu; za video koristi
     * slicicu koju je napravio pregledac (prvi kadar).
     *
     * @param array<string, mixed> $data caption, taken_at
     */
    public function handle(Site $site, UploadedFile $file, ?UploadedFile $thumbnail, array $data): SiteMedia
    {
        $mime = $file->getMimeType() ?: $file->getClientMimeType();
        $type = MediaType::fromMimeType($mime) === MediaType::VIDEO ? MediaType::VIDEO : MediaType::IMAGE;
        $extension = strtolower($file->getClientOriginalExtension() ?: $file->extension() ?: 'bin');
        $directory = "sites/{$site->id}/media";
        $name = (string) Str::uuid();

        $path = $file->storeAs($directory, "{$name}.{$extension}", 'local');

        $width = null;
        $height = null;
        $thumbnailPath = null;
        $source = $type === MediaType::IMAGE ? $file : $thumbnail;

        if ($source) {
            try {
                $image = Image::read($source->getRealPath());

                if ($type === MediaType::IMAGE) {
                    $width = $image->width();
                    $height = $image->height();
                }

                $thumbnailPath = "{$directory}/{$name}_thumb.jpg";
                Storage::disk('local')->put(
                    $thumbnailPath,
                    (string) $image->scaleDown(width: (int) config('sparkylink.media.thumbnail_width'))->toJpeg(80)
                );
            } catch (Throwable $exception) {
                // Npr. HEIC bez podrske u GD - fajl se cuva, samo bez slicice.
                Log::info('Slicica nije napravljena.', ['file' => $file->getClientOriginalName(), 'error' => $exception->getMessage()]);
                $thumbnailPath = null;
            }
        }

        return SiteMedia::query()->create([
            'site_id' => $site->id,
            'user_id' => auth()->id(),
            'type' => $type,
            'disk' => 'local',
            'path' => $path,
            'thumbnail_path' => $thumbnailPath,
            'original_name' => Str::limit($file->getClientOriginalName(), 250, ''),
            'mime_type' => Str::limit($mime, 100, ''),
            'size' => $file->getSize() ?: 0,
            'width' => $width,
            'height' => $height,
            'caption' => $data['caption'] ?? null,
            'taken_at' => $data['taken_at'] ?? null,
        ]);
    }
}

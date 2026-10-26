<?php

use App\Enums\MediaType;
use Carbon\CarbonInterface;
use Illuminate\Filesystem\Filesystem;
use Psy\Readline\Hoa\FileDoesNotExistException;

if (! function_exists('ensure_dirs_exist')) {
    /**
     * Ensures that provided directory names exist
     *
     * @param string ...$dirs
     *
     * @return void
     */
    function ensure_dirs_exist(string ...$dirs): void
    {
        foreach ($dirs as $dir) {
            app(Filesystem::class)->ensureDirectoryExists($dir);
        }
    }
}

if (! function_exists('generate_temp_file')) {
    /**
     * Generates a shortened day name from given date.
     *
     * @param string $contents
     *
     * @return string
     */
    function generate_temp_file(string $contents): string
    {
        $prefix = str(config('app.name'))->snake()->lower();
        $tempPath = tempnam(sys_get_temp_dir(), $prefix);

        file_put_contents($tempPath, $contents);

        return $tempPath;
    }
}

if (! function_exists('format_file_size')) {
    /**
     * Formats file size into higher units if possible.
     *
     * @param int $size
     *
     * @return string
     */
    function format_file_size(int $size): string
    {
        $resultGb = $size / pow(1024, 3);
        $resultMb = $size / pow(1024, 2);

        if ($resultGb >= 1) {
            return number_format($resultGb, 1) . 'GB';
        }

        if ($resultMb >= 1) {
            return number_format($resultMb, 1) . 'MB';
        }

        return number_format($size / 1024, 1) . 'KB';
    }
}

if (! function_exists('get_image_dimensions')) {
    /**
     * Returns image dimensions. [width and height]
     *
     * @param string $filePath
     *
     * @return stdClass
     *
     * @throws FileDoesNotExistException
     */
    function get_image_dimensions(string $filePath): stdClass
    {
        if (! file_exists($filePath)) {
            throw new FileDoesNotExistException("File '{$filePath}' does not exist.");
        }
        $dimensions = new stdClass;
        $data = getimagesize($filePath);

        $dimensions->width = $data[0];
        $dimensions->height = $data[1];

        return $dimensions;
    }
}

if (! function_exists('generate_export_file_name')) {
    /**
     * Generates readable filename when exporting entities with provided timestamps.
     *
     * @param string $entityTranslationKey
     * @param CarbonInterface|null $dateFrom
     * @param CarbonInterface|null $dateTo
     * @param string $extension
     * @param bool $withHash
     *
     * @return string
     */
    function generate_export_file_name(
        string          $entityTranslationKey,
        ?CarbonInterface $dateFrom = null,
        ?CarbonInterface $dateTo = null,
        string          $extension = 'xlsx',
        bool            $withHash = true
    ): string
    {
        $entityTranslation = str(__lc("exports.{$entityTranslationKey}"))->snake();
        $name = __lc('exports.report') . '_' . $entityTranslation;
        $hash = str()->random();

        if ($dateFrom || $dateTo) {
            $from = $dateFrom ? $dateFrom->format('d.m.Y') : __lc('exports.from_beginning');
            $to = $dateTo ? $dateTo->format('d.m.Y') : __lc('exports.until_now');

            $name = __lc('exports.report') . '_' . $entityTranslation
                . '_' . __lc('exports.from') . '_' . $from
                . '_' . __lc('exports.until') . '_' . $to;
        }

        return $withHash
            ? "{$name}_{$hash}.{$extension}"
            : "{$name}.{$extension}";
    }
}

if (! function_exists('get_media_type')) {
    /**
     * Returns MediaType enumeration from media mime type.
     *
     * @param string $mimeType
     *
     * @return MediaType
     */
    function get_media_type(string $mimeType): MediaType
    {
        return match (true) {
            str_contains($mimeType, 'image/svg+xml') => MediaType::SVG,
            str_contains($mimeType, 'image') => MediaType::IMAGE,
            str_contains($mimeType, 'video') => MediaType::VIDEO,
            default => MediaType::UNKNOWN
        };
    }
}

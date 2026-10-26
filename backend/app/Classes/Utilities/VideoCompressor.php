<?php

namespace App\Classes\Utilities;

use FFMpeg\Coordinate\Dimension;
use FFMpeg\Coordinate\FrameRate;
use FFMpeg\Filters\Video\VideoFilters;
use FFMpeg\Format\Video\X264;
use Illuminate\Support\Facades\Storage;
use ProtoneMedia\LaravelFFMpeg\MediaOpener;
use ProtoneMedia\LaravelFFMpeg\Support\FFMpeg;

class VideoCompressor
{
    public function __construct(
        protected readonly string $tempFilePath,
        protected readonly string $storePath,
        protected readonly string $readDisk = 'public',
        protected readonly string $storeDisk = 'public',
    ) {}

    public function compress(): void
    {
        $video = FFMpeg::fromDisk($this->readDisk)->open($this->tempFilePath);

        $videoStream = $video->getVideoStream();

        $currentResolution = $videoStream->getDimensions();

        $newResolution = $this->determineResolution($currentResolution);

        $bitrate = $this->determineBitrate($newResolution);

        $format = (new X264)->setKiloBitrate($bitrate);

        $videoFrameRate = $this->extractFramesAsInt($videoStream->get('avg_frame_rate'));

        $this->determineFrameRate($video, $videoFrameRate)
             ->addFilter(fn (VideoFilters $filters) => $filters->resize($newResolution))
             ->export()
             ->toDisk($this->storeDisk)
             ->inFormat($format)
             ->save($this->storePath);
    }

    public function deleteTempFile(): void
    {
        Storage::disk($this->readDisk)->delete($this->tempFilePath);
    }

    private function extractFramesAsInt(string $videoFrameRate): int
    {
        return (int) explode('/', $videoFrameRate)[0];
    }

    private function determineFrameRate(MediaOpener $video, int $videoFrameRate, int $gop = 4): MediaOpener
    {
        if ($videoFrameRate > 30) {
            return $video->addFilter(fn (VideoFilters $filters) => $filters
                ->framerate(new FrameRate(30), $gop)->synchronize());
        }

        return $video;
    }

    private function determineResolution(Dimension $dimensions): Dimension
    {
        $width = $dimensions->getWidth();
        $height = $dimensions->getHeight();

        /**
         * mobile devices usually record in portrait mode, so we need to ensure that
         * the resolution stays the same and doesn't get inverted during compression process.
         */
        if ($this->isFullHD($width, $height)) {
            return $width > $height
                ? new Dimension(1920, 1080)
                : new Dimension(1080, 1920);
        } elseif ($this->isHD($width, $height)) {
            return $width > $height
                ? new Dimension(1280, 720)
                : new Dimension(720, 1280);
        } else {
            return $width > $height
                ? new Dimension(640, 480)
                : new Dimension(480, 640);
        }
    }

    private function determineBitrate(Dimension $dimensions): int
    {
        $width = $dimensions->getWidth();
        $height = $dimensions->getHeight();

        /**
         * bitrate vastly affects video size, recommended bitrate for each resolution varies,
         * but these are some standard ranges, adjust accordingly.
         * FULL HD 1080p (1920x1080) 3,500-6,0000 kbps
         * HD 720p (1280x720) 1,500-4,000 kbps
         * High Profile (640x480) 1,200-1,500 kbps
         */
        if ($this->isFullHD($width, $height)) {
            return 4_000;
        } elseif ($this->isHD($width, $height)) {
            return 2_500;
        } else {
            return 1_500;
        }
    }

    private function isFullHD(int $width, int $height): bool
    {
        return ($width >= 1920 && $height >= 1080) || ($height >= 1920 && $width >= 1080);
    }

    private function isHD(int $width, int $height): bool
    {
        return ($width >= 1280 && $height >= 720) || ($height >= 1280 && $width >= 720);
    }
}

<?php

namespace App\Console\Commands;

use Exception;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Symfony\Component\Finder\SplFileInfo;

class ClearTempFilesCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'clear-temp-files';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clears temporary files located at storage/app/public/temp';

    /**
     * Number of files deleted.
     *
     * @var int
     */
    protected int $filesDeleted = 0;

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        try {
            $this->components->info('Clearing temporary files at storage/app/public/temp ...');
            $this->newLine();

            $this->clearDirectoryRecursively(
                public_storage_path('temp')
            );

            $this->printSuccessMessage();
        } catch (Exception $ex) {
            $this->components->error($ex->getMessage());
        }
    }

    private function clearDirectoryRecursively(string $directory): void
    {
        $this->clearFiles(
            File::files($directory)
        );

        foreach (File::directories($directory) as $subDirectory) {
            $this->clearDirectoryRecursively($subDirectory);
        }
    }

    private function clearFiles(array $files): void
    {
        $thresholdDate = now()->subHours(2);

        /** @var SplFileInfo $file */
        foreach ($files as $file) {
            $fileLastModifiedDate = Carbon::createFromTimestamp($file->getMTime(), date_default_timezone_get());

            if ($fileLastModifiedDate->lt($thresholdDate)) {
                $this->deleteFile($file);
            }
        }
    }

    private function deleteFile(SplFileInfo $file): void
    {
        $deletedSuccessfully = File::delete($file);

        if ($deletedSuccessfully) {
            $this->filesDeleted++;
        }
    }

    private function printSuccessMessage(): void
    {
        $message = " Total of {$this->filesDeleted} temporary files deleted. ";
        $emptySpace = str_repeat(' ', strlen($message));

        $this->line("<fg=white;bg=green>{$emptySpace}</>");
        $this->line("<fg=white;bg=green>{$message}</>");
        $this->line("<fg=white;bg=green>{$emptySpace}</>");

        $this->newLine();
    }
}

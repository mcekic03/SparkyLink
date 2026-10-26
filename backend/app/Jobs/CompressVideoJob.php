<?php

namespace App\Jobs;

use App\Classes\Utilities\VideoCompressor;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CompressVideoJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        protected VideoCompressor $videoCompressor
    ) {}

    public function handle(): void
    {
        $this->videoCompressor->compress();

        $this->videoCompressor->deleteTempFile();
    }
}

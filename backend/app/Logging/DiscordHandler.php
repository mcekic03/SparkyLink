<?php

namespace App\Logging;

use App\Models\User;
use Cache;
use Exception;
use GuzzleHttp\Client;
use Illuminate\Support\Str;
use Log;
use Monolog\Handler\AbstractProcessingHandler;
use Monolog\Level;
use Monolog\LogRecord;

class DiscordHandler extends AbstractProcessingHandler
{
    protected string $webhookUrl;

    protected int $logRateLimiter;

    protected int $logInterval;

    public function __construct(string $webhook_url, int|Level|string $level, int $log_rate_limiter, int $log_interval)
    {
        parent::__construct($level);
        $this->webhookUrl = $webhook_url;
        $this->logRateLimiter = $log_rate_limiter;
        $this->logInterval = $log_interval;
    }

    protected function write(LogRecord $record): void
    {
        /** @var int $logCount */
        $logCount = Cache::store('file')->get('log_count', 0);

        if ($logCount >= $this->logRateLimiter) {
            return;
        }

        try {
            $this->attemptDiscordLog($record);
        } catch (Exception) {
            Log::channel('single')->error('SlackLogHandler failed: ' . $record->message);
        } finally {
            Cache::store('file')->put('log_count', $logCount + 1, $this->logInterval);
        }
    }

    private function attemptDiscordLog(LogRecord $record): void
    {
        /** @var User $auth */
        $auth = auth()->user();

        $client = new Client;
        $client->post($this->webhookUrl, [
            'json' => [
                'embeds' => [
                    [
                        'title' => 'Environment: ' . app()->environment(),
                        'description' => $record->message ?? '',
                        'color' => 16711680,
                        'footer' => [
                            'text' => '',
                        ],
                        'author' => [
                            'id' => $auth->id ?? 'No user id',
                            'email' => $auth ? $auth->email : 'No user email',
                        ],
                        'fields' => [],
                        'timestamp' => $record->datetime->format('Y-m-d H:i:s'),
                    ],
                ],
                'content' => '```' . Str::limit($record->formatted, 1_500, ' (...)') . '```',
            ],
        ]);
    }
}

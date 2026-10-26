<?php

namespace App\Logging;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Monolog\Handler\AbstractProcessingHandler;
use Monolog\Level;
use Monolog\LogRecord;
use Throwable;

/**
 * Slack Log Handler for comprehensive error logging.
 *
 * Logs include:
 * - Exception details (type, file, line, message, fingerprint)
 * - Authenticated user info
 * - Queue job info (class, method, file, line, payload)
 * - Middleware info (when error originates in middleware)
 * - Controller, method, and line number
 * - Route name and URI
 * - Request data (query params, POST body, files, response status)
 * - SQL queries (failed query + recent queries from log)
 * - Stack trace
 * - System info (memory, execution time, PHP/Laravel version)
 * - Git info (branch, commit)
 */
class SlackLogHandler extends AbstractProcessingHandler
{
    protected string $webhookUrl;

    protected string $channel;

    protected string $username;

    protected string $emoji;

    protected int $rateLimitCount;

    protected int $rateLimitInterval;

    protected bool $includeStackTrace;

    protected int $stackTraceLimit;

    public function __construct(
        string $webhook_url,
        string $channel = '#errors',
        string $username = 'Laravel Logger',
        string $emoji = ':rotating_light:',
        int|Level|string $level = Level::Error,
        int $rate_limit_count = 20,
        int $rate_limit_interval = 60,
        bool $include_stack_trace = true,
        int $stack_trace_limit = 10
    ) {
        parent::__construct($level);

        $this->webhookUrl = $webhook_url;
        $this->channel = $channel;
        $this->username = $username;
        $this->emoji = $emoji;
        $this->rateLimitCount = $rate_limit_count;
        $this->rateLimitInterval = $rate_limit_interval;
        $this->includeStackTrace = $include_stack_trace;
        $this->stackTraceLimit = $stack_trace_limit;
    }

    protected function write(LogRecord $record): void
    {
        if ($this->isRateLimited()) {
            return;
        }

        try {
            $this->sendToSlack($record);
        } catch (Throwable $e) {
            Log::channel('slack_default')->error('SlackLogHandler failed: ' . $e->getMessage());

            Log::channel('single')->error('SlackLogHandler failed: ' . $e->getMessage());
        } finally {
            $this->incrementRateLimit();
        }
    }

    protected function sendToSlack(LogRecord $record): void
    {
        $payload = [
            'channel' => $this->channel,
            'username' => $this->username,
            'icon_emoji' => $this->emoji,
            'attachments' => [
                [
                    'color' => $this->getColorForLevel($record->level),
                    'blocks' => $this->buildBlocks($record),
                ],
            ],
        ];

        $this->postToWebhook($payload);
    }

    protected function buildBlocks(LogRecord $record): array
    {
        $blocks = [];
        $contextException = $record->context['exception'] ?? null;
        $exception = $contextException instanceof Throwable ? $contextException : null;

        // Header
        $blocks[] = $this->buildHeader($record);
        $blocks[] = $this->buildEnvironmentContext($record);
        $blocks[] = ['type' => 'divider'];

        // Error message
        $blocks[] = $this->buildMessageBlock($record);

        // Exception details
        if ($exception) {
            $blocks = array_merge($blocks, $this->buildExceptionBlocks($exception));
        }

        // User info
        $userBlocks = $this->buildUserBlocks();
        if (! empty($userBlocks)) {
            $blocks = array_merge($blocks, $userBlocks);
        }

        // Queue Job info
        $jobBlocks = $this->buildQueueJobBlocks($exception);
        if (! empty($jobBlocks)) {
            $blocks = array_merge($blocks, $jobBlocks);
        }

        // Middleware info
        $middlewareBlocks = $this->buildMiddlewareBlocks($exception);
        if (! empty($middlewareBlocks)) {
            $blocks = array_merge($blocks, $middlewareBlocks);
        }

        // Route & Controller
        $routeBlocks = $this->buildRouteBlocks($exception);
        if (! empty($routeBlocks)) {
            $blocks = array_merge($blocks, $routeBlocks);
        }

        // Request info
        $requestBlocks = $this->buildRequestBlocks();
        if (! empty($requestBlocks)) {
            $blocks = array_merge($blocks, $requestBlocks);
        }

        // SQL queries
        $queryBlocks = $this->buildQueryBlocks($exception);
        if (! empty($queryBlocks)) {
            $blocks = array_merge($blocks, $queryBlocks);
        }

        // Stack trace
        if ($this->includeStackTrace && $exception) {
            $blocks = array_merge($blocks, $this->buildStackTraceBlocks($exception));
        }

        // System & Git info
        $blocks = array_merge($blocks, $this->buildFooterBlocks());

        return $blocks;
    }

    protected function buildHeader(LogRecord $record): array
    {
        $levelEmoji = $this->getLevelEmoji($record->level);
        $appName = config('app.name', 'Laravel');

        return [
            'type' => 'header',
            'text' => [
                'type' => 'plain_text',
                'text' => "{$levelEmoji} " . strtoupper($record->level->name) . " - {$appName}",
                'emoji' => true,
            ],
        ];
    }

    protected function buildEnvironmentContext(LogRecord $record): array
    {
        return [
            'type' => 'context',
            'elements' => [
                [
                    'type' => 'mrkdwn',
                    'text' => '*Env:* `' . app()->environment() . '` | *Time:* ' . $record->datetime->format('Y-m-d H:i:s T'),
                ],
            ],
        ];
    }

    protected function buildMessageBlock(LogRecord $record): array
    {
        return [
            'type' => 'section',
            'text' => [
                'type' => 'mrkdwn',
                'text' => "*Message:*\n```" . Str::limit($record->message, 1000) . '```',
            ],
        ];
    }

    protected function buildExceptionBlocks(Throwable $exception): array
    {
        $blocks = [];
        $blocks[] = ['type' => 'divider'];

        $exceptionClass = get_class($exception);
        $relativePath = str_replace(base_path() . '/', '', $exception->getFile());
        $fingerprint = $this->generateErrorFingerprint($exception);

        $blocks[] = [
            'type' => 'section',
            'text' => [
                'type' => 'mrkdwn',
                'text' => '*:rotating_light: Exception Details*',
            ],
        ];

        $blocks[] = [
            'type' => 'section',
            'fields' => [
                [
                    'type' => 'mrkdwn',
                    'text' => "*Type:*\n`{$exceptionClass}`",
                ],
                [
                    'type' => 'mrkdwn',
                    'text' => "*Code:*\n`" . $exception->getCode() . '`',
                ],
                [
                    'type' => 'mrkdwn',
                    'text' => "*File:*\n`{$relativePath}`",
                ],
                [
                    'type' => 'mrkdwn',
                    'text' => "*Line:*\n`" . $exception->getLine() . '`',
                ],
            ],
        ];

        // Error fingerprint for grouping similar errors
        $blocks[] = [
            'type' => 'context',
            'elements' => [
                [
                    'type' => 'mrkdwn',
                    'text' => "*Fingerprint:* `{$fingerprint}`",
                ],
            ],
        ];

        // Previous exception
        if ($exception->getPrevious()) {
            $prev = $exception->getPrevious();
            $prevFile = str_replace(base_path() . '/', '', $prev->getFile());

            $blocks[] = [
                'type' => 'context',
                'elements' => [
                    [
                        'type' => 'mrkdwn',
                        'text' => '*Caused by:* `' . get_class($prev) . '` at `' . $prevFile . ':' . $prev->getLine() . '`',
                    ],
                ],
            ];
        }

        return $blocks;
    }

    protected function generateErrorFingerprint(Throwable $exception): string
    {
        // Create a unique fingerprint based on exception type, file, line, and message pattern
        $components = [
            get_class($exception),
            str_replace(base_path() . '/', '', $exception->getFile()),
            $exception->getLine(),
            // Normalize message by removing variable data (IDs, timestamps, etc.)
            preg_replace('/\b\d+\b/', '{id}', $exception->getMessage()),
        ];

        return substr(md5(implode('|', $components)), 0, 12);
    }

    protected function buildUserBlocks(): array
    {
        try {
            /** @var User|null $user */
            $user = auth()->user();
            if (! $user) {
                return [];
            }
        } catch (Throwable) {
            return [];
        }

        $blocks = [];
        $blocks[] = ['type' => 'divider'];

        $blocks[] = [
            'type' => 'section',
            'text' => [
                'type' => 'mrkdwn',
                'text' => '*:bust_in_silhouette: Authenticated User*',
            ],
        ];

        $fields = [
            [
                'type' => 'mrkdwn',
                'text' => "*ID:*\n`{$user->id}`",
            ],
            [
                'type' => 'mrkdwn',
                'text' => "*Email:*\n`" . ($user->email ?? 'N/A') . '`',
            ],
        ];

        if (isset($user->company_id)) {
            $fields[] = [
                'type' => 'mrkdwn',
                'text' => "*Company ID:*\n`{$user->company_id}`",
            ];
        }

        if (isset($user->role_id) || isset($user->role)) {
            $role = $user->role->label ?? $user->role_id ?? 'N/A';
            $fields[] = [
                'type' => 'mrkdwn',
                'text' => "*Role:*\n`{$role}`",
            ];
        }

        $blocks[] = [
            'type' => 'section',
            'fields' => array_slice($fields, 0, 4),
        ];

        return $blocks;
    }

    protected function buildQueueJobBlocks(?Throwable $exception): array
    {
        if (! $exception) {
            return [];
        }

        $jobInfo = $this->extractJobInfoFromTrace($exception);
        if (! $jobInfo) {
            return [];
        }

        $blocks = [];
        $blocks[] = ['type' => 'divider'];

        $blocks[] = [
            'type' => 'section',
            'text' => [
                'type' => 'mrkdwn',
                'text' => '*:gear: Queue Job*',
            ],
        ];

        $fields = [
            [
                'type' => 'mrkdwn',
                'text' => "*Job Class:*\n`{$jobInfo['class']}`",
            ],
            [
                'type' => 'mrkdwn',
                'text' => "*Method:*\n`{$jobInfo['method']}`",
            ],
            [
                'type' => 'mrkdwn',
                'text' => "*File:*\n`{$jobInfo['file']}`",
            ],
            [
                'type' => 'mrkdwn',
                'text' => "*Line:*\n`{$jobInfo['line']}`",
            ],
        ];

        $blocks[] = [
            'type' => 'section',
            'fields' => $fields,
        ];

        // Show queue and connection if available
        if (! empty($jobInfo['queue']) || ! empty($jobInfo['connection'])) {
            $contextParts = [];
            if (! empty($jobInfo['connection'])) {
                $contextParts[] = "*Connection:* `{$jobInfo['connection']}`";
            }
            if (! empty($jobInfo['queue'])) {
                $contextParts[] = "*Queue:* `{$jobInfo['queue']}`";
            }
            if (! empty($jobInfo['attempts'])) {
                $contextParts[] = "*Attempts:* `{$jobInfo['attempts']}`";
            }

            $blocks[] = [
                'type' => 'context',
                'elements' => [
                    [
                        'type' => 'mrkdwn',
                        'text' => implode(' | ', $contextParts),
                    ],
                ],
            ];
        }

        // Show job payload if available
        if (! empty($jobInfo['payload'])) {
            $payloadJson = json_encode(
                $this->filterSensitiveData($jobInfo['payload']),
                JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
            );

            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*Job Payload:*\n```" . Str::limit($payloadJson, 800) . '```',
                ],
            ];
        }

        return $blocks;
    }

    protected function extractJobInfoFromTrace(Throwable $exception): ?array
    {
        $trace = $exception->getTrace();

        // Common job-related class patterns
        $jobPatterns = [
            'Illuminate\\Queue\\Jobs\\',
            'Illuminate\\Queue\\CallQueuedHandler',
            'App\\Jobs\\',
        ];

        // Look for the actual job class in the trace
        foreach ($trace as $frame) {
            $class = $frame['class'] ?? '';
            $file = $frame['file'] ?? '';

            // Check if this is a job class
            $isJob = false;
            foreach ($jobPatterns as $pattern) {
                if (str_contains($class, $pattern) || str_contains($file, 'Jobs/')) {
                    $isJob = true;
                    break;
                }
            }

            // Also check if class implements ShouldQueue or uses Queueable
            if (! $isJob && class_exists($class)) {
                try {
                    $interfaces = class_implements($class) ?: [];
                    $isJob = isset($interfaces['Illuminate\\Contracts\\Queue\\ShouldQueue']);
                } catch (Throwable) {
                    // Ignore reflection errors
                }
            }

            if ($isJob && ! str_contains($class, 'Illuminate\\Queue\\')) {
                $relativePath = str_replace(base_path() . '/', '', $file);

                $jobInfo = [
                    'class' => class_basename($class),
                    'fqcn' => $class,
                    'method' => $frame['function'] ?? 'handle',
                    'file' => $relativePath ?: 'N/A',
                    'line' => $frame['line'] ?? 'N/A',
                    'queue' => null,
                    'connection' => null,
                    'attempts' => null,
                    'payload' => null,
                ];

                // Try to get queue details and payload from the job instance
                $this->enrichJobInfoFromTrace($jobInfo, $trace);

                return $jobInfo;
            }
        }

        // Check if we're in a queue worker context by looking for CallQueuedHandler
        foreach ($trace as $frame) {
            $class = $frame['class'] ?? '';

            if ($class === 'Illuminate\\Queue\\CallQueuedHandler') {
                // Find the job being processed
                foreach ($trace as $innerFrame) {
                    if (isset($innerFrame['args'][0]) && is_object($innerFrame['args'][0])) {
                        $job = $innerFrame['args'][0];
                        $jobClass = get_class($job);

                        if (! str_contains($jobClass, 'Illuminate\\')) {
                            $jobInfo = [
                                'class' => class_basename($jobClass),
                                'fqcn' => $jobClass,
                                'method' => 'handle',
                                'file' => 'N/A',
                                'line' => 'N/A',
                                'queue' => null,
                                'connection' => null,
                                'attempts' => null,
                                'payload' => $this->extractJobPayload($job),
                            ];

                            return $jobInfo;
                        }
                    }
                }
            }
        }

        return null;
    }

    protected function enrichJobInfoFromTrace(array &$jobInfo, array $trace): void
    {
        try {
            // Try to get current job from queue worker
            if (app()->bound('queue.worker')) {
                $worker = app('queue.worker');
                if (method_exists($worker, 'getCurrentJob')) {
                    $currentJob = $worker->getCurrentJob();
                    if ($currentJob) {
                        $jobInfo['queue'] = $currentJob->getQueue() ?? null;
                        $jobInfo['connection'] = $currentJob->getConnectionName() ?? null;
                        $jobInfo['attempts'] = $currentJob->attempts() ?? null;
                    }
                }
            }

            // Try to extract job payload from trace arguments
            foreach ($trace as $frame) {
                if (isset($frame['args'])) {
                    foreach ($frame['args'] as $arg) {
                        if (is_object($arg) && $this->isJobInstance($arg)) {
                            $jobInfo['payload'] = $this->extractJobPayload($arg);

                            return;
                        }
                    }
                }
            }
        } catch (Throwable) {
            // Ignore - job details not available
        }
    }

    protected function isJobInstance(object $object): bool
    {
        $interfaces = class_implements($object) ?: [];

        return isset($interfaces['Illuminate\\Contracts\\Queue\\ShouldQueue'])
            || str_contains(get_class($object), 'Jobs\\');
    }

    protected function extractJobPayload(object $job): ?array
    {
        try {
            $payload = [];
            $reflection = new \ReflectionClass($job);

            // Get public properties
            foreach ($reflection->getProperties(\ReflectionProperty::IS_PUBLIC) as $property) {
                $name = $property->getName();

                // Skip internal Laravel queue properties
                if (in_array($name, ['job', 'connection', 'queue', 'delay', 'chained', 'middleware', 'afterCommit'])) {
                    continue;
                }

                $value = $property->getValue($job);
                $payload[$name] = $this->formatPayloadValue($value);
            }

            // Also try to get constructor parameters that might be stored
            foreach ($reflection->getProperties(\ReflectionProperty::IS_PROTECTED | \ReflectionProperty::IS_PRIVATE) as $property) {
                $name = $property->getName();

                // Skip internal properties
                if (in_array($name, ['job', 'connection', 'queue', 'delay', 'chained', 'middleware', 'afterCommit', 'backoff', 'tries', 'maxExceptions', 'timeout'])) {
                    continue;
                }

                $property->setAccessible(true);
                $value = $property->getValue($job);

                // Only include non-null scalar values and simple arrays
                if ($value !== null && (is_scalar($value) || is_array($value))) {
                    $payload[$name] = $this->formatPayloadValue($value);
                }
            }

            return ! empty($payload) ? $payload : null;
        } catch (Throwable) {
            return null;
        }
    }

    protected function formatPayloadValue(mixed $value): mixed
    {
        if (is_object($value)) {
            // For Eloquent models, get the key
            if (method_exists($value, 'getKey')) {
                return [
                    '_type' => class_basename($value),
                    'id' => $value->getKey(),
                ];
            }

            return '[' . class_basename($value) . ']';
        }

        if (is_array($value)) {
            // Limit array size
            if (count($value) > 10) {
                return array_slice($value, 0, 10) + ['...' => '(' . (count($value) - 10) . ' more items)'];
            }

            return array_map(fn ($v) => $this->formatPayloadValue($v), $value);
        }

        return $value;
    }

    protected function buildMiddlewareBlocks(?Throwable $exception): array
    {
        if (! $exception) {
            return [];
        }

        $middlewareInfo = $this->extractMiddlewareInfoFromTrace($exception);
        if (! $middlewareInfo) {
            return [];
        }

        $blocks = [];
        $blocks[] = ['type' => 'divider'];

        $blocks[] = [
            'type' => 'section',
            'text' => [
                'type' => 'mrkdwn',
                'text' => '*:shield: Middleware*',
            ],
        ];

        $fields = [
            [
                'type' => 'mrkdwn',
                'text' => "*Middleware:*\n`{$middlewareInfo['class']}`",
            ],
            [
                'type' => 'mrkdwn',
                'text' => "*Method:*\n`{$middlewareInfo['method']}`",
            ],
            [
                'type' => 'mrkdwn',
                'text' => "*File:*\n`{$middlewareInfo['file']}`",
            ],
            [
                'type' => 'mrkdwn',
                'text' => "*Line:*\n`{$middlewareInfo['line']}`",
            ],
        ];

        $blocks[] = [
            'type' => 'section',
            'fields' => $fields,
        ];

        return $blocks;
    }

    protected function extractMiddlewareInfoFromTrace(Throwable $exception): ?array
    {
        // Only show middleware info if the exception originated FROM a middleware file
        $exceptionFile = $exception->getFile();

        if (! str_contains($exceptionFile, 'Middleware/') && ! str_contains($exceptionFile, 'Middleware\\')) {
            return null;
        }

        $relativePath = str_replace(base_path() . '/', '', $exceptionFile);

        // Try to find the middleware class from the trace
        $trace = $exception->getTrace();
        $middlewareClass = null;
        $method = null;

        foreach ($trace as $frame) {
            $class = $frame['class'] ?? '';
            $file = $frame['file'] ?? '';

            if ($file === $exceptionFile && ! empty($class)) {
                $middlewareClass = $class;
                $method = $frame['function'] ?? 'handle';
                break;
            }
        }

        // If we couldn't find the class, extract it from the file path
        if (! $middlewareClass) {
            // Extract class name from path like "app/Http/Middleware/SetClientLocale.php"
            if (preg_match('/Middleware[\/\\\\](\w+)\.php$/', $exceptionFile, $matches)) {
                $middlewareClass = $matches[1];
            } else {
                $middlewareClass = basename($exceptionFile, '.php');
            }
            $method = 'handle';
        }

        return [
            'class' => class_basename($middlewareClass),
            'fqcn' => $middlewareClass,
            'method' => $method,
            'file' => $relativePath,
            'line' => $exception->getLine(),
        ];
    }

    protected function buildRouteBlocks(?Throwable $exception): array
    {
        $route = Route::current();

        if (! $route) {
            return [];
        }

        $blocks = [];
        $blocks[] = ['type' => 'divider'];

        $blocks[] = [
            'type' => 'section',
            'text' => [
                'type' => 'mrkdwn',
                'text' => '*:link: Route & Controller*',
            ],
        ];

        $routeName = $route->getName() ?? 'N/A';
        $routeUri = $route->uri();
        $methods = implode(', ', $route->methods());

        $controller = 'Closure';
        $action = 'N/A';
        $controllerLine = 'N/A';

        $actionName = $route->getActionName();
        if ($actionName && $actionName !== 'Closure') {
            $parts = explode('@', $actionName);
            $controllerFqcn = $parts[0] ?? $actionName;
            $controller = class_basename($controllerFqcn);
            $action = $parts[1] ?? 'N/A';

            // Find controller line from stack trace
            if ($exception instanceof Throwable) {
                $controllerLine = $this->findControllerLineFromTrace($exception, $controllerFqcn, $action);
            }
        }

        $fields = [
            [
                'type' => 'mrkdwn',
                'text' => "*Route:*\n`{$routeName}`",
            ],
            [
                'type' => 'mrkdwn',
                'text' => "*URI:*\n`[{$methods}] {$routeUri}`",
            ],
            [
                'type' => 'mrkdwn',
                'text' => "*Controller:*\n`{$controller}`",
            ],
            [
                'type' => 'mrkdwn',
                'text' => "*Method:*\n`{$action}` (line: `{$controllerLine}`)",
            ],
        ];

        $blocks[] = [
            'type' => 'section',
            'fields' => $fields,
        ];

        // Route parameters
        $params = $route->parameters();
        if (! empty($params)) {
            $paramsStr = collect($params)
                ->map(fn ($value, $key) => "{$key}: " . $this->formatValue($value))
                ->implode(', ');

            $blocks[] = [
                'type' => 'context',
                'elements' => [
                    [
                        'type' => 'mrkdwn',
                        'text' => '*Route Params:* ' . Str::limit($paramsStr, 200),
                    ],
                ],
            ];
        }

        return $blocks;
    }

    protected function findControllerLineFromTrace(Throwable $exception, string $controllerFqcn, string $method): string
    {
        foreach ($exception->getTrace() as $frame) {
            $frameClass = $frame['class'] ?? '';
            $frameFunction = $frame['function'] ?? '';

            if ($frameClass === $controllerFqcn && $frameFunction === $method) {
                return (string) ($frame['line'] ?? 'N/A');
            }
        }

        return 'N/A';
    }

    protected function buildRequestBlocks(): array
    {
        try {
            /** @var Request|null $request */
            $request = request();

            if (! $request) {
                return [];
            }
        } catch (Throwable) {
            return [];
        }

        $blocks = [];
        $blocks[] = ['type' => 'divider'];

        $blocks[] = [
            'type' => 'section',
            'text' => [
                'type' => 'mrkdwn',
                'text' => '*:incoming_envelope: Request Information*',
            ],
        ];

        // Get expected response status code
        $statusCode = $this->getExpectedResponseStatus();

        $blocks[] = [
            'type' => 'section',
            'fields' => [
                [
                    'type' => 'mrkdwn',
                    'text' => "*Method:*\n`" . $request->method() . '`',
                ],
                [
                    'type' => 'mrkdwn',
                    'text' => "*URL:*\n`" . Str::limit($request->fullUrl(), 100) . '`',
                ],
                [
                    'type' => 'mrkdwn',
                    'text' => "*IP:*\n`" . $request->ip() . '`',
                ],
                [
                    'type' => 'mrkdwn',
                    'text' => "*Response Status:*\n`" . $statusCode . '`',
                ],
            ],
        ];

        // Query parameters (GET)
        $query = $request->query();
        if (! empty($query)) {
            $queryJson = json_encode($this->filterSensitiveData($query), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*Query Params (GET):*\n```" . Str::limit($queryJson, 500) . '```',
                ],
            ];
        }

        // POST body
        $postData = $request->post();
        if (! empty($postData)) {
            $postJson = json_encode($this->filterSensitiveData($postData), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*Body Params (POST):*\n```" . Str::limit($postJson, 800) . '```',
                ],
            ];
        }

        // Uploaded files
        $files = $request->allFiles();
        if (! empty($files)) {
            $filesInfo = $this->formatUploadedFiles($files);

            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*Uploaded Files:*\n```" . Str::limit($filesInfo, 500) . '```',
                ],
            ];
        }

        return $blocks;
    }

    protected function formatUploadedFiles(array $files, string $prefix = ''): string
    {
        $result = [];

        foreach ($files as $key => $file) {
            $fieldName = $prefix ? "{$prefix}.{$key}" : $key;

            if (is_array($file)) {
                $result[] = $this->formatUploadedFiles($file, $fieldName);
            } elseif ($file instanceof \Illuminate\Http\UploadedFile) {
                $result[] = "{$fieldName}: {$file->getClientOriginalName()} ({$file->getSize()} bytes, {$file->getMimeType()})";
            }
        }

        return implode("\n", array_filter($result));
    }

    protected function getExpectedResponseStatus(): string
    {
        try {
            // Try to get the response status from the exception handler context
            $exceptionHandler = app(\Illuminate\Contracts\Debug\ExceptionHandler::class);

            // Check if we have a response being prepared
            if (app()->bound('response')) {
                $response = app('response');
                if (method_exists($response, 'getStatusCode')) {
                    return (string) $response->getStatusCode();
                }
            }

            // Infer status code from exception type
            $exception = request()->attributes->get('exception');
            if ($exception instanceof Throwable) {
                return $this->inferStatusCodeFromException($exception);
            }

            // Default for unhandled errors
            return '500';
        } catch (Throwable) {
            return '500';
        }
    }

    protected function inferStatusCodeFromException(Throwable $exception): string
    {
        // Check if exception has a status code
        if (method_exists($exception, 'getStatusCode')) {
            return (string) $exception->getStatusCode();
        }

        // Map common exception types to status codes
        $exceptionClass = get_class($exception);

        $statusMap = [
            'Symfony\Component\HttpKernel\Exception\NotFoundHttpException' => '404',
            'Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException' => '403',
            'Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException' => '401',
            'Symfony\Component\HttpKernel\Exception\BadRequestHttpException' => '400',
            'Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException' => '405',
            'Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException' => '429',
            'Symfony\Component\HttpKernel\Exception\ServiceUnavailableHttpException' => '503',
            'Illuminate\Auth\AuthenticationException' => '401',
            'Illuminate\Auth\Access\AuthorizationException' => '403',
            'Illuminate\Database\Eloquent\ModelNotFoundException' => '404',
            'Illuminate\Validation\ValidationException' => '422',
            'Illuminate\Session\TokenMismatchException' => '419',
        ];

        foreach ($statusMap as $class => $code) {
            if ($exception instanceof $class || $exceptionClass === $class) {
                return $code;
            }
        }

        return '500';
    }

    protected function buildQueryBlocks(?Throwable $exception): array
    {
        $blocks = [];
        $hasQueryException = $exception instanceof QueryException;

        // Show failed query for QueryException
        if ($hasQueryException) {
            $blocks[] = ['type' => 'divider'];

            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => '*:floppy_disk: Database Query Error*',
                ],
            ];

            $sql = $exception->getSql();
            $bindings = $exception->getBindings();
            $formattedSql = $this->interpolateQuery($sql, $bindings);

            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*Failed Query:*\n```sql\n" . Str::limit($formattedSql, 1000) . "\n```",
                ],
            ];

            $connectionName = $exception->getConnectionName() ?? config('database.default');
            $blocks[] = [
                'type' => 'context',
                'elements' => [
                    [
                        'type' => 'mrkdwn',
                        'text' => '*Connection:* `' . $connectionName . '` | *SQL Error Code:* `' . $exception->getCode() . '`',
                    ],
                ],
            ];
        }

        // Show recent queries from query log (if enabled)
        $recentQueries = $this->getRecentQueries();
        if (! empty($recentQueries)) {
            if (empty($blocks)) {
                $blocks[] = ['type' => 'divider'];

                $blocks[] = [
                    'type' => 'section',
                    'text' => [
                        'type' => 'mrkdwn',
                        'text' => '*:floppy_disk: Recent SQL Queries*',
                    ],
                ];
            }

            $queriesText = collect($recentQueries)
                ->take(5)
                ->map(fn ($q, $i) => ($i + 1) . '. ' . Str::limit($q['query'], 150) . ' (' . round($q['time'], 2) . 'ms)')
                ->implode("\n");

            $blocks[] = [
                'type' => 'section',
                'text' => [
                    'type' => 'mrkdwn',
                    'text' => "*Query Log:*\n```" . $queriesText . '```',
                ],
            ];
        }

        return $blocks;
    }

    protected function interpolateQuery(string $sql, array $bindings): string
    {
        foreach ($bindings as $binding) {
            if ($binding === null) {
                $value = 'NULL';
            } elseif (is_bool($binding)) {
                $value = $binding ? 'TRUE' : 'FALSE';
            } elseif (is_string($binding)) {
                $value = "'" . addslashes($binding) . "'";
            } else {
                $value = (string) $binding;
            }

            $sql = preg_replace('/\?/', $value, $sql, 1);
        }

        return $sql;
    }

    protected function buildStackTraceBlocks(Throwable $exception): array
    {
        $blocks = [];
        $blocks[] = ['type' => 'divider'];

        $blocks[] = [
            'type' => 'section',
            'text' => [
                'type' => 'mrkdwn',
                'text' => '*:scroll: Stack Trace* (top ' . $this->stackTraceLimit . ' frames)',
            ],
        ];

        $trace = collect($exception->getTrace())
            ->take($this->stackTraceLimit)
            ->map(function ($frame, $index) {
                $file = isset($frame['file'])
                    ? str_replace(base_path() . '/', '', $frame['file'])
                    : '[internal]';
                $line = $frame['line'] ?? '?';
                $class = $frame['class'] ?? '';
                $function = $frame['function'] ?? '';
                $type = $frame['type'] ?? '';

                return "#{$index} {$file}:{$line}\n   {$class}{$type}{$function}()";
            })
            ->implode("\n\n");

        $blocks[] = [
            'type' => 'section',
            'text' => [
                'type' => 'mrkdwn',
                'text' => '```' . Str::limit($trace, 2000) . '```',
            ],
        ];

        return $blocks;
    }

    protected function buildFooterBlocks(): array
    {
        $blocks = [];
        $blocks[] = ['type' => 'divider'];

        // System info
        $memoryUsage = round(memory_get_peak_usage(true) / 1024 / 1024, 2);
        $executionTime = defined('LARAVEL_START')
            ? round((microtime(true) - LARAVEL_START) * 1000, 2)
            : 'N/A';

        $executionTimeSeconds = $executionTime === 'N/A'
            ? 'N/A'
            : round($executionTime / 1000, 2);

        $blocks[] = [
            'type' => 'context',
            'elements' => [
                [
                    'type' => 'mrkdwn',
                    'text' => "*Memory:* `{$memoryUsage} MB` | *Exec Time:* `{$executionTime} ms ({$executionTimeSeconds} s)` | *PHP:* `" . PHP_VERSION . '` | *Laravel:* `' . app()->version() . '`',
                ],
            ],
        ];

        // Server info
        $serverName = gethostname() ?: 'Unknown';

        $blocks[] = [
            'type' => 'context',
            'elements' => [
                [
                    'type' => 'mrkdwn',
                    'text' => "*Server:* `{$serverName}`",
                ],
            ],
        ];

        // Git info
        $gitInfo = $this->getGitInfo();
        if ($gitInfo) {
            $blocks[] = [
                'type' => 'context',
                'elements' => [
                    [
                        'type' => 'mrkdwn',
                        'text' => "*Git:* `{$gitInfo['branch']}` @ `{$gitInfo['commit']}`",
                    ],
                ],
            ];
        }

        return $blocks;
    }

    protected function getGitInfo(): ?array
    {
        // Check if shell_exec is available and not disabled
        if (! function_exists('shell_exec') || $this->isShellExecDisabled()) {
            return null;
        }

        try {
            // Check if git is available
            $gitCheck = @shell_exec('which git 2>/dev/null');
            if (empty(trim((string) $gitCheck))) {
                return null;
            }

            // Check if we're in a git repository
            $gitDir = @shell_exec('git rev-parse --git-dir 2>/dev/null');
            if (empty(trim((string) $gitDir))) {
                return null;
            }

            $gitBranch = trim((string) @shell_exec('git rev-parse --abbrev-ref HEAD 2>/dev/null'));
            $gitCommit = trim((string) @shell_exec('git rev-parse --short HEAD 2>/dev/null'));

            if ($gitBranch && $gitCommit) {
                return [
                    'branch' => $gitBranch,
                    'commit' => $gitCommit,
                ];
            }
        } catch (Throwable) {
            // Ignore - git not available or other issue
        }

        return null;
    }

    protected function isShellExecDisabled(): bool
    {
        $disabled = explode(',', (string) ini_get('disable_functions'));

        return in_array('shell_exec', array_map('trim', $disabled));
    }

    protected function getRecentQueries(): array
    {
        try {
            return array_slice(DB::getQueryLog(), -5);
        } catch (Throwable) {
            return [];
        }
    }

    protected function filterSensitiveData(array $data): array
    {
        $sensitiveKeys = [
            'password',
            'password_confirmation',
            'current_password',
            'new_password',
            'token',
            'api_key',
            'secret',
            'authorization',
            'credit_card',
            'card_number',
            'cvv',
            'ssn',
        ];

        return collect($data)->map(function ($value, $key) use ($sensitiveKeys) {
            foreach ($sensitiveKeys as $sensitive) {
                if (Str::contains(strtolower($key), $sensitive)) {
                    return '[REDACTED]';
                }
            }

            if (is_array($value)) {
                return $this->filterSensitiveData($value);
            }

            return $value;
        })->toArray();
    }

    protected function formatValue(mixed $value): string
    {
        if (is_object($value)) {
            if (method_exists($value, 'getKey')) {
                return (string) $value->getKey();
            }

            return get_class($value);
        }

        if (is_array($value)) {
            return json_encode($value);
        }

        return (string) $value;
    }

    protected function getColorForLevel(Level $level): string
    {
        return match ($level) {
            Level::Emergency, Level::Alert, Level::Critical => '#FF0000',
            Level::Error => '#E74C3C',
            Level::Warning => '#F39C12',
            Level::Notice => '#3498DB',
            Level::Info => '#2ECC71',
            Level::Debug => '#95A5A6',
        };
    }

    protected function getLevelEmoji(Level $level): string
    {
        return match ($level) {
            Level::Emergency => ':fire:',
            Level::Alert => ':bell:',
            Level::Critical => ':rotating_light:',
            Level::Error => ':x:',
            Level::Warning => ':warning:',
            Level::Notice => ':mega:',
            Level::Info => ':information_source:',
            Level::Debug => ':bug:',
        };
    }

    protected function isRateLimited(): bool
    {
        $cacheKey = 'slack_log_count_' . date('YmdHi');

        return Cache::store('file')->get($cacheKey, 0) >= $this->rateLimitCount;
    }

    protected function incrementRateLimit(): void
    {
        $cacheKey = 'slack_log_count_' . date('YmdHi');
        $count = Cache::store('file')->get($cacheKey, 0);
        Cache::store('file')->put($cacheKey, $count + 1, $this->rateLimitInterval);
    }

    protected function postToWebhook(array $payload): void
    {
        $ch = curl_init($this->webhookUrl);

        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
        ]);

        curl_exec($ch);
        curl_close($ch);
    }
}

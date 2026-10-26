<?php

namespace App\Classes;

use App\Actions\Shared\CreateModelAction;
use App\Actions\Shared\UpdateModelAction;
use App\Classes\Macros\SyncUpdateHasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOneOrMany;
use Illuminate\Support\Facades\Response;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;
use Symfony\Component\HttpFoundation\Response as HttpResponse;

class Macros
{
    public static function initialize(): void
    {
        self::rules();
        self::response();
        self::eloquent();
        self::relationships();
    }

    private static function rules(): void
    {
        Rule::macro(
            'uniqueWithIgnore',
            function (string $table, string $column, ?Model $model) {
                return Rule::unique($table, $column)
                           ->when($model, fn (Unique $query) => $query->ignoreModel($model));
            }
        );
    }

    private static function response(): void
    {
        Response::macro(
            'success',
            function (?string $message = null, mixed $data = null, ?array $pagination = null) {
                $payload = [];

                if ($message) {
                    $payload['message'] = $message;
                }

                if ($pagination) {
                    $payload['pagination'] = $pagination;
                }

                if (! is_null($data)) {
                    $payload['data'] = $data;
                }

                return response()->json($payload);
            }
        );

        Response::macro('unexpectedError', function () {
            return response()->json([
                'message' => __('unexpected_error_occurred'),
            ], HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
        });

        Response::macro('unauthorized', function (string $message) {
            return response()->json([
                'message' => $message,
            ], HttpResponse::HTTP_UNAUTHORIZED);
        });

        Response::macro('unprocessable', function (string $message) {
            return response()->json([
                'message' => $message,
            ], HttpResponse::HTTP_UNPROCESSABLE_ENTITY);
        });

        Response::macro(
            'downloadWithMessage',
            function (string $filePath, ?string $message = null, bool $deleteAfterSend = true) {
                $headers = [];

                if ($message) {
                    $headers['X-Success-Message'] = rawurlencode($message);
                }

                $response = response()->download(
                    file: $filePath,
                    name: basename($filePath),
                    headers: $headers,
                );

                if ($deleteAfterSend) {
                    $response->deleteFileAfterSend();
                }

                return $response;
            }
        );
    }

    private static function eloquent(): void
    {
        Builder::macro(
            'store',
            fn (array $fields, bool $force = false) => app(CreateModelAction::class)
                ->handle($this->getModel()::class, $fields, $force)
        );

        Builder::macro(
            'patch',
            fn (array $fields, bool $force = false) => app(UpdateModelAction::class)
                ->handle($this->getModel(), $fields, $force)
        );

        Builder::macro(
            'randomId',
            fn (?callable $query = null) => $this->inRandomOrder()->when($query, $query)->value('id')
        );
    }

    private static function relationships(): void
    {
        HasMany::macro(
            'syncUpdate',
            fn (iterable $records, bool $force = false) => SyncUpdateHasMany::make($this, $records)->handle($force)
        );

        HasOneOrMany::macro(
            'forceCreateMany',
            fn (iterable $records) => Model::unguarded(fn () => $this->createMany($records))
        );
    }
}

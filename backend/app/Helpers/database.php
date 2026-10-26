<?php

use Illuminate\Contracts\Database\Query\Expression;

if (! function_exists('transact')) {
    /**
     * Opens database transaction.
     *
     * @param callable $commit
     * @param callable|null $rollback
     *
     * @return mixed
     *
     * @throws Exception|Throwable
     */
    function transact(callable $commit, ?callable $rollback = null): mixed
    {
        try {
            DB::beginTransaction();

            $result = $commit();

            DB::commit();

            return $result;
        } catch (Exception $ex) {
            DB::rollBack();

            if ($rollback) {
                $rollback($ex);
            } else {
                throw $ex;
            }

            return $ex;
        }
    }
}

if (! function_exists('db_now_raw')) {
    /**
     * Raw expression for NOW() function in the database.
     * Used in migrations to set a default value for datetime columns to current time.
     *
     * @return Expression
     */
    function db_now_raw(): Expression
    {
        return DB::raw('NOW()');
    }
}

if (! function_exists('bypass_full_group_by')) {
    /**
     * Executes callable with disabled ONLY_FULL_GROUP_BY mode.
     *
     * @param callable $callable
     * @param string|null $connection
     *
     * @return mixed
     */
    function bypass_full_group_by(callable $callable, ?string $connection = null): mixed
    {
        DB::connection($connection)->statement(
            "SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))"
        );

        $result = $callable();

        DB::connection($connection)->statement(
            "SET SESSION sql_mode=(CONCAT(@@sql_mode, ',ONLY_FULL_GROUP_BY'))"
        );

        return $result;
    }
}

if (! function_exists('db_core_name')) {
    /**
     * Get core connection database name
     *
     * @param string|null $reference
     *
     * @return string
     */
    function db_core_name(?string $reference = null): string
    {
        $reference = $reference
            ? ".{$reference}"
            : '';

        return config('database.connections.mysql.database') . $reference;
    }
}

if (! function_exists('db_core_connection')) {
    /**
     * Get core database connection
     *
     * @return string
     */
    function db_core_connection(): string
    {
        return config('database.default');
    }
}

if (! function_exists('connection_db_name')) {
    /**
     * Get specified connection database name
     *
     * @param string $connection
     * @param string|null $reference
     *
     * @return string
     */
    function connection_db_name(string $connection, ?string $reference = null): string
    {
        $reference = $reference
            ? ".{$reference}"
            : '';

        return config("database.connections.{$connection}.database") . $reference;
    }
}

if (! function_exists('db_disable_strict')) {
    /**
     * Temporary disables the db connection mode for current connection/ session
     *
     * @param string|null $connection
     *
     * @return void
     */
    function db_disable_strict(?string $connection = null): void
    {
        DB::connection($connection)->statement("SET SQL_MODE=''");
    }
}

if (! function_exists('get_latest_id')) {
    /**
     * Returns the next auto-increment value for specified model.
     *
     * @param string $modelClass
     *
     * @return int
     */
    function get_latest_id(string $modelClass): int
    {
        $model = app($modelClass);

        return (int) DB::connection($model->getConnection()->getName())
                       ->select("SHOW TABLE STATUS LIKE '{$model->getTable()}'")[0]->Auto_increment;
    }
}

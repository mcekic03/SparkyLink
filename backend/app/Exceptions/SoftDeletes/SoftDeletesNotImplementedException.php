<?php

namespace App\Exceptions\SoftDeletes;

use App\Exceptions\BaseException;
use Throwable;

class SoftDeletesNotImplementedException extends BaseException
{
    protected string $productionMessage = 'Soft deletes not implemented.';

    public function __construct(string $class, ?Throwable $previous = null)
    {
        $message = "{$class} does not implement Illuminate\Database\Eloquent\SoftDeletes";

        parent::__construct($message, 500, $previous);
    }
}

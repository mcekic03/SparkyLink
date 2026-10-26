<?php

namespace App\Exceptions;

use Throwable;

class MissingParameterException extends BaseException
{
    protected string $productionMessage = 'Missing required property.';

    public function __construct(string $class, string $property, ?Throwable $previous = null)
    {
        $message = "You are missing required property '{$property}' in class '{$class}'";

        parent::__construct($message, 500, $previous);
    }
}

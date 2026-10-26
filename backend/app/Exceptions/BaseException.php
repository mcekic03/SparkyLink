<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\Response;

abstract class BaseException extends Exception
{
    protected string $productionMessage = 'Something went wrong. No message specified.';

    public function render(): Response|bool
    {
        if (! app()->environment('production')) {
            return false;
        }

        return response(['message' => $this->productionMessage], $this->getCode());
    }
}

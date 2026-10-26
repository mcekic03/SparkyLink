<?php

namespace App\Exceptions;

use Illuminate\Contracts\Validation\Validator;
use Illuminate\Validation\ValidationException;

class LocalizedValidationException extends ValidationException
{
    /**
     * Create an error message summary from the validation errors.
     *
     * @param Validator $validator
     *
     * @return string
     */
    protected static function summarize($validator): string
    {
        $messages = $validator->errors()->all();

        if (! count($messages)) {
            return 'The given data was invalid.';
        }

        $message = array_shift($messages);
        $additional = count($messages);

        if ($additional) {
            $pluralized = __n('app.errors', $additional);

            $message .= __('localized_validation_exception', [
                'additional' => $additional,
                'pluralized' => $pluralized,
            ]);
        }

        return $message;
    }
}

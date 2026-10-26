<?php

namespace App\Exceptions\SoftDeletes;

use App\Exceptions\BaseException;
use Throwable;

class InvalidSoftDeletesRelationshipsException extends BaseException
{
    protected string $productionMessage = 'Invalid relationships defined for soft deletes.';

    public function __construct(array $relationships, ?Throwable $previous = null)
    {
        $message = sprintf(
            '%s [%s] must exist and return an object of type Illuminate\Database\Eloquent\Relations\Relation',
            str('Relationship')->plural(count($relationships)),
            implode(', ', $relationships)
        );

        parent::__construct($message, 500, $previous);
    }
}

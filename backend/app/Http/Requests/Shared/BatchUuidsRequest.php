<?php

namespace App\Http\Requests\Shared;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;

class BatchUuidsRequest extends LocalizedFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // TODO NOTE DANGER: Segment corresponds to segment in the URL which symbolizes entity(table in DB)
        // If we are using current template structure where API routes go in `admin.php` segment is 3 because
        // for the route `/api/admin/users` word `users` is in segment number `3`
        // If we were to use routes inside `api.php` example route will be `/api/users` where segment is 2

        // Since entity names in routes are in kebab-case format we need to convert them to snake-case,
        // so they match table names in database.
        $tableName = str($this->segment(3))->replace('-', '_');

        return [
            'ids' => Ruly::make(true)
                         ->array()
                         ->assign(),
            'ids.*' => Ruly::make(true)
                           ->string()
                           ->exists($tableName, 'id')
                           ->assign(),
        ];
    }
}

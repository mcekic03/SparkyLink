<?php

namespace App\Traits\FormRequest;

/**
 * Very light helper trait which unwraps default wrapped body by FormData request.
 */
trait WorksWithFormData
{
    protected function prepareForValidation()
    {
        $wrappedData = json_decode(json: $this->get('data'), associative: true) ?? [];

        $this->merge($wrappedData);

        $this->getInputSource()->remove('data');

        $this->excludeEmptyStringInputs();
    }
}

<?php

namespace App\Classes;

use App\Exceptions\LocalizedValidationException;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class LocalizedFormRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [];
    }

    // Overrides
    protected function prepareForValidation(): void
    {
        $this->excludeEmptyStringInputs();
    }

    protected function failedValidation(Validator $validator)
    {
        throw (new LocalizedValidationException($validator))
            ->errorBag($this->errorBag)
            ->redirectTo($this->getRedirectUrl());
    }

    /**
     * This method automatizes the process of excluding inputs which FE provides
     * in the form of empty string. When value is not present within some input, FE
     * returns empty string instead of null.
     * In order not to use <code>Rule::excludeIf(empty($this->input))</code> on each filed
     * where this could happen, this method runs and exactly does that.
     *
     * @return void
     */
    protected function excludeEmptyStringInputs(): void
    {
        $rules = $this->rules();

        foreach ($this->all() as $key => $value) {
            if (! array_key_exists($key, $rules)) {
                continue;
            }

            if (is_string($value) && trim($value) === '' && $this->fieldShouldBeExcluded($rules, $key)) {
                $this->getInputSource()->remove($key);
            }
        }
    }

    private function fieldShouldBeExcluded(array $rules, string $key): bool
    {
        $fieldRules = $rules[$key];

        if (is_array($fieldRules)) {
            return in_array('required', $fieldRules) || ! in_array('string', $fieldRules);
        }

        return $fieldRules === 'required';
    }
}

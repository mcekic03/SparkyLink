<?php

namespace App\Traits\Model;

use App\Exceptions\MissingParameterException;
use Illuminate\Database\Eloquent\Model;

/**
 * Sets default values when creating/updating models which are defined in $defaults property of a class.
 * Other than simple values, you can also use other attributes of a model as default values for a field.
 */
trait HasAttributeDefaults
{
    /**
     * Before create/update set defaults provided on model.
     *
     * @return void
     *
     * @throws MissingParameterException
     */
    protected static function bootHasAttributeDefaults()
    {
        if (! property_exists(static::class, 'defaults')) {
            throw new MissingParameterException(class: static::class, property: 'defaults');
        }

        static::creating(function (Model $model) {
            /** @var static $model */
            foreach ($model->getDefaults() as $attribute => $default) {
                $model->{$attribute} = is_null($model->{$attribute})
                    ? $model->getDefaultValue($model, $default)
                    : $model->{$attribute};
            }
        });

        static::updating(function (Model $model) {
            /** @var static $model */
            foreach ($model->getDefaults() as $attribute => $default) {
                /**
                 * This check is required in situations when we do not select all columns in a model and call save on it.
                 * In this case, our model could be loaded without an attribute we used default value for and when saving it
                 * `$model->{$attribute}` will return null since there is no attribute on the model, and then it will override
                 * it with default, causing the model to lose its attribute value stored in DB.
                 */
                if ($model->attributeExistsOnModel($model, $attribute)) {
                    $model->{$attribute} = is_null($model->{$attribute})
                        ? $model->getDefaultValue($model, $default)
                        : $model->{$attribute};
                }
            }
        });
    }

    private function getDefaults(): array
    {
        return (new static)->defaults;
    }

    private function getDefaultValue(Model $model, mixed $default): mixed
    {
        if (is_string($default) && $this->attributeExistsOnModel($model, $default)) {
            return $model->{$default};
        }

        if (is_callable($default)) {
            return $default($model);
        }

        return $default;
    }

    private function attributeExistsOnModel(Model $model, string $attribute): bool
    {
        return in_array($attribute, array_keys($model->getAttributes()));
    }
}

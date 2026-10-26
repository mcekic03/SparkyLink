<?php

namespace App\Classes\Utilities;

use App\Enums\MediaType;
use Closure;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Enum;
use Illuminate\Validation\Rules\Password;

class Ruly
{
    protected array $rule = [];

    public function __construct(protected ?bool $required = null)
    {
        if (! is_null($required)) {
            $this->rule[] = $required ? 'required' : 'nullable';
        }
    }

    public static function make(?bool $required = null): static
    {
        return new static($required);
    }

    protected function ruleAlreadyExists(string $rule): bool
    {
        return in_array($rule, $this->rule);
    }

    public function assign(): array
    {
        return $this->rule;
    }

    public function custom(mixed $custom): static
    {
        $this->rule[] = $custom;

        return $this;
    }

    public function required(): static
    {
        if (! $this->ruleAlreadyExists('required')) {
            $this->rule[] = 'required';
        }

        return $this;
    }

    public function nullable(): static
    {
        if (! $this->ruleAlreadyExists('nullable')) {
            $this->rule[] = 'nullable';
        }

        return $this;
    }

    public function sometimes(): static
    {
        if (! $this->ruleAlreadyExists('sometimes')) {
            $this->rule[] = 'sometimes';
        }

        return $this;
    }

    public function requiredWith(string $value): static
    {
        $this->rule[] = "required_with:{$value}";

        return $this;
    }

    public function requiredWithAll(array $values): static
    {
        $value = implode(',', $values);

        $this->rule[] = "required_with_all:{$value}";

        return $this;
    }

    public function requiredWithout(string $value): static
    {
        $this->rule[] = "required_without:{$value}";

        return $this;
    }

    public function requiredWithoutAll(array $values): static
    {
        $value = implode(',', $values);

        $this->rule[] = "required_without_all:{$value}";

        return $this;
    }

    public function min(int $value = 0): static
    {
        $this->rule[] = "min:{$value}";

        return $this;
    }

    public function max(int $value = 255): static
    {
        $this->rule[] = "max:{$value}";

        return $this;
    }

    public function size(int $size): static
    {
        $this->rule[] = "size:{$size}";

        return $this;
    }

    // ######################## * STRINGS * #########################
    public function string(): static
    {
        $this->rule[] = 'string';

        return $this;
    }

    public function fullString(int $max = 255): static
    {
        return $this->string()->max($max);
    }

    public function text(): static
    {
        return $this->string()->max(65_535);
    }

    public function startsWith(string ...$string): static
    {
        $values = implode(',', $string);

        $this->rule[] = "starts_with:{$values}";

        return $this;
    }

    public function phone(string $prefix): static
    {
        $this->regex("^\\$prefix\d+$");

        return $this;
    }

    public function email(): static
    {
        $this->rule[] = 'email';

        return $this->string()->max();
    }

    public function regex(string $regex): static
    {
        $this->rule[] = "regex:/{$regex}/";

        return $this;
    }

    public function hex(): static
    {
        $this->regex('^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$');

        return $this;
    }

    // ######################## * PASSWORD * #########################
    public function confirmed(): static
    {
        $this->rule[] = 'confirmed';

        return $this;
    }

    public function password(int $min = 8): static
    {
        $this->rule[] = Password::min($min)
                                ->letters()
                                ->mixedCase()
                                ->symbols();

        return $this;
    }

    // ######################## * RULES * #########################
    public function exists(string $table, string $column, ?Closure $closure = null): static
    {
        $rule = Rule::exists($table, $column);

        if ($closure) {
            $closure($rule);
        }

        $this->rule[] = $rule;

        return $this;
    }

    public function unique(string $table, string $column, ?Closure $closure = null): static
    {
        $rule = Rule::unique($table, $column);

        if ($closure) {
            $closure($rule);
        }

        $this->rule[] = $rule;

        return $this;
    }

    public function uniqueWithIgnore(string $table, string $column, ?Model $model, ?Closure $closure = null): static
    {
        $rule = Rule::uniqueWithIgnore($table, $column, $model);

        if ($closure) {
            $closure($rule);
        }

        $this->rule[] = $rule;

        return $this;
    }

    public function in(array $array): static
    {
        $this->rule[] = Rule::in($array);

        return $this;
    }

    public function excludeIf(bool|callable $callback): static
    {
        $this->rule[] = Rule::excludeIf($callback);

        return $this;
    }

    public function requiredIf(bool|callable $condition): static
    {
        $this->rule[] = Rule::requiredIf($condition);

        return $this;
    }

    public function enum(string $enum): static
    {
        $this->rule[] = new Enum($enum);

        return $this;
    }

    // ######################## * ARRAYS * #########################
    public function array(string ...$keys): static
    {
        $rule = 'array';

        if ($keys) {
            $arrayKeys = implode(',', $keys);

            $rule .= ":{$arrayKeys}";
        }

        $this->rule[] = $rule;

        return $this;
    }

    public function requiredArrayKeys(string ...$keys): static
    {
        if (empty($keys)) {
            return $this;
        }

        $rule = 'required_array_keys';

        $arrayKeys = implode(',', $keys);

        $rule .= ":{$arrayKeys}";

        $this->rule[] = $rule;

        return $this;
    }

    public function distinct(): static
    {
        $this->rule[] = 'distinct';

        return $this;
    }

    public function present(): static
    {
        $this->rule[] = 'present';

        return $this;
    }

    // ######################## * MEDIA * #########################
    public function assignMedia(
        string $validationKey,
        ?callable $callback = null,
        MediaType $mediaType = MediaType::IMAGE
    ): array
    {
        $this->clearRules();

        $mediaValidation = Ruly::make(false);

        if (! $callback) {
            $mediaValidation = match ($mediaType) {
                MediaType::IMAGE => $mediaValidation->image(),
                MediaType::VIDEO => $mediaValidation->video(),
                default => $mediaValidation->file(),
            };

            $this->rule[$validationKey] = $mediaValidation->assign();
        } else {
            $this->rule[$validationKey] = $callback(Ruly::make())->assign();
        }

        $this->rule["{$validationKey}_data"] = Ruly::make()
                                                   ->mediaData()
                                                   ->assign();

        return $this->rule;
    }

    public function image(array $mimes = ['jpeg', 'jpg', 'png', 'webp'], ?int $max = null): static
    {
        $this->rule[] = 'image:allow_svg';
        $this->rule[] = 'mimes:' . implode(',', $mimes);
        $this->rule[] = 'max:' . ($max ?? config('validation.image_size'));

        return $this;
    }

    public function video(array $mimes = ['avi', 'mp4'], ?int $max = null): static
    {
        $this->rule[] = 'file';
        $this->rule[] = 'mimes:' . implode(',', $mimes);
        $this->rule[] = 'max:' . ($max ?? config('validation.video_size'));

        return $this;
    }

    public function file(?int $max = null): static
    {
        $this->rule[] = 'file';
        $this->rule[] = 'max:' . ($max ?? config('validation.file_size'));

        return $this;
    }

    public function mimes(string ...$mimes): static
    {
        $this->rule[] = 'mimes:' . implode(',', $mimes);

        return $this;
    }

    public function mediaData(): static
    {
        return $this->nullable()->array();
    }

    // ######################## * TYPES * #########################
    public function integer(): static
    {
        $this->rule[] = 'integer';

        return $this;
    }

    public function numeric(): static
    {
        $this->rule[] = 'numeric';

        return $this;
    }

    public function between(int $min = 0, int $max = 255): static
    {
        $this->rule[] = "between:{$min},{$max}";

        return $this;
    }

    public function decimal(int $min = 1, ?int $max = null): static
    {
        $this->rule[] = $max
            ? "decimal:{$min},{$max}"
            : "decimal:{$min}";

        return $this;
    }

    public function digits(int $digits): static
    {
        $this->rule[] = "digits:{$digits}";

        return $this;
    }

    public function maxDigits(int $max): static
    {
        $this->rule[] = "max_digits:{$max}";

        return $this;
    }

    public function minDigits(int $min): static
    {
        $this->rule[] = "min_digits:{$min}";

        return $this;
    }

    public function digitsBetween(int $min, int $max): static
    {
        $this->rule[] = "digits_between:{$min},{$max}";

        return $this;
    }

    public function boolean(): static
    {
        $this->rule[] = 'boolean';

        return $this;
    }

    // ######################## * CONDITIONALS * #########################
    public function greaterThan(string|int $value): static
    {
        $this->rule[] = "gt:{$value}";

        return $this;
    }

    public function greaterThanOrEqual(string|int $value): static
    {
        $this->rule[] = "gte:{$value}";

        return $this;
    }

    public function lessThan(string|int $value): static
    {
        $this->rule[] = "lt:{$value}";

        return $this;
    }

    public function lessThanOrEqual(string|int $value): static
    {
        $this->rule[] = "lte:{$value}";

        return $this;
    }

    public function when(bool $condition, callable $happyPath, ?callable $sadPath = null): static
    {
        if ($condition) {
            return $happyPath($this);
        }

        return $sadPath
            ? $sadPath($this)
            : $this;
    }

    // ######################## * DATES * #########################
    public function date(): static
    {
        $this->rule[] = 'date';

        return $this;
    }

    public function dateEquals(string $value): static
    {
        $this->rule[] = "date_equals:{$value}";

        return $this;
    }

    public function dateFormat(string $format): static
    {
        $this->rule[] = "date_format:{$format}";

        return $this;
    }

    public function before(string $value): static
    {
        $this->rule[] = "before:{$value}";

        return $this;
    }

    public function after(string $value): static
    {
        $this->rule[] = "after:{$value}";

        return $this;
    }

    // ######################## * SPECIAL * #########################
    private function clearRules(): void
    {
        $this->rule = [];
    }
}

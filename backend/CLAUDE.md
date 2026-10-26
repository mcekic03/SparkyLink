# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with Laravel code in this repository.

---

## Quick Reference

| Task | Code |
|------|------|
| **Model with search/filter** | `use Filterable;` |
| **Model with files** | `use HasFileFields;` + `$casts = ['file' => File::class]` |
| **Model with timezone dates** | `use IsTimezoneAware;` + `$timezoneAwareDates = ['date']` |
| **Validation rule** | `Ruly::make(true)->fullString()->assign()` |
| **Pagination response** | `generate_pagination_data($paginator)` |
| **Action class** | `use AsAction;` + `::make()->handle()` |
| **Enum** | `use HasEnumHelpers;` + `enum Role: int { case ADMIN = 1; }` |
| **Query with filters** | `Model::query()->filters()->with(...)->paginate()` |
| **Eager load** | `Post::with('user', 'comments')->get()` |
| **Response** | `response()->success(data: Resource::collection($items))` |

---

## Critical Rules ⚠️

### ALWAYS ✅
1. **Extend `LocalizedFormRequest`** (not `FormRequest`) for all form requests
2. **Use `generate_pagination_data($paginator)`** for all paginated API responses
3. **Include `Filterable` trait** in models with index endpoints
4. **Use `query()` before chaining scopes**: `User::query()->filters()->get()`
5. **Use `Ruly` helper class** for all validation rules
6. **Call `assign()` method** to return Ruly validation rules
7. **Use response macros** - `response()->success()`, `response()->unauthorized()`, etc.
8. **Use `new Resource()`** for single resources (not `Resource::make()`)
9. **Use Actions for business logic** - Keep controllers thin
10. **Use integer-backed Enums** starting at 1 (never 0)
11. **Include `HasEnumHelpers` trait** in every enum
12. **Include `AsAction` trait** in all Action classes
13. **Add type hints and return types** to ALL methods
14. **Use `dateTime()` for date columns** (never `timestamp()`)
15. **Suffix date columns with `_at`** (e.g., `created_at`, `approved_at`)

### NEVER ❌
1. **NEVER use `$guarded`** - Always use `$fillable`
2. **NEVER use `response()->json()` directly** - Use response macros
3. **NEVER use raw array validation** - Use Ruly helper class
4. **NEVER forget `assign()`** on Ruly chains
5. **NEVER use string-backed Enums** - Always use integers
6. **NEVER start enum values at 0** - Always start at 1
7. **NEVER use `timestamp()` in migrations** - Use `dateTime()`
8. **NEVER create N+1 queries** - Always eager load relationships
9. **NEVER put business logic in controllers** - Use Actions
10. **NEVER return models directly** - Use API Resources

---

## Table of Contents

1. [Technology Stack](#technology-stack)
2. [Project Structure](#project-structure)
3. [Naming Conventions](#naming-conventions)
4. [Database & Migrations](#database--migrations)
5. [Models](#models)
6. [Enums](#enums)
7. [Validation with Ruly](#validation-with-ruly)
8. [Actions Pattern](#actions-pattern)
9. [Controllers](#controllers)
10. [API Resources & Responses](#api-resources--responses)
11. [Filterable Pattern](#filterable-pattern)
12. [Localization](#localization)
13. [File & Image Handling](#file--image-handling)
14. [Queue System](#queue-system)
15. [Multi-Tenancy](#multi-tenancy)
16. [Testing](#testing)
17. [Code Style](#code-style)
18. [Common Commands](#common-commands)
19. [Common Mistakes](#common-mistakes)
20. [AI Assistant Workflow](#ai-assistant-workflow)

---

## Technology Stack

### Core Framework
- **PHP**: 8.2+ or 8.3+
- **Laravel**: 10+ or 12+
- **Database**: MySQL 8.0+ or MariaDB
- **Authentication**: Laravel Sanctum (token-based API)

### Essential Packages
- **Validation**: `Ruly` helper class (`app/Classes/Utilities/Ruly.php`)
- **Image Processing**: `intervention/image-laravel`
- **Excel**: `maatwebsite/excel`, `openspout/openspout`
- **Activity Log**: `spatie/laravel-activitylog`
- **Code Quality**: `laravel/pint`, `larastan/larastan`, `barryvdh/laravel-ide-helper`
- **Debugging**: `itsgoingd/clockwork`

### Queue Configuration
- **Development**: `sync` or `database` (for immediate execution)
- **Production**: `database` driver (ALWAYS use queued jobs)

---

## Project Structure

```
app/
├── Actions/{Feature}/         # Business logic (use AsAction trait)
│   ├── Admin/                 # Admin-specific actions
│   ├── App/                   # Frontend/mobile actions
│   └── Shared/                # Reusable actions
├── Classes/
│   ├── LocalizedFormRequest   # Base request (ALWAYS extend this)
│   └── Utilities/
│       ├── Ruly               # Fluent validation builder
│       └── FormValidationBuilder  # Dynamic form validation
├── Enums/                     # PHP enums (use HasEnumHelpers trait)
├── Helpers/                   # Helper functions
├── Http/
│   ├── Controllers/{Feature}/
│   │   ├── Admin/
│   │   └── App/
│   ├── Middleware/
│   ├── Requests/{Feature}/    # LocalizedFormRequest subclasses
│   └── Resources/             # API resources
├── Models/                    # Eloquent models
├── Rules/                     # Custom validation rules
├── Traits/
│   ├── Core/                  # AsAction, HasEnumHelpers, Mediable
│   └── Model/                 # Filterable, Togglable, HasFileFields, etc.
└── helpers.php

routes/
├── admin.php                  # Admin panel routes
├── app.php                    # Mobile app routes
├── api.php                    # API routes
└── web.php                    # Web routes
```

---

## Naming Conventions

### Database

| Element | Convention | Example |
|---------|-----------|---------|
| **Tables** | plural `snake_case` | `users`, `sale_reports`, `device_logs` |
| **Columns** | `snake_case` | `first_name`, `created_at`, `is_active` |
| **Foreign Keys** | `{table}_id` | `user_id`, `company_id`, `device_id` |
| **Pivot Tables** | Alphabetical order | `company_user`, `product_promotion` |
| **Boolean Columns** | `is_/has_/can_` prefix | `is_active`, `has_permission`, `can_approve` |
| **Date Columns** | Must end with `_at` | `created_at`, `approved_at`, `last_sync_at` |
| **Enum Columns** | Descriptive name (tinyInteger) | `status`, `type`, `role_id` |

### PHP Code

| Element | Convention | Example |
|---------|-----------|---------|
| **Models** | Singular PascalCase | `User`, `SaleReport`, `DeviceLog` |
| **Controllers** | PascalCase + `Controller` | `UserController`, `ReportController` |
| **Actions** | Verb + Noun + `Action` | `CreateUserAction`, `ApproveReportAction` |
| **Requests** | `{Action}{Model}Request` | `StoreUserRequest`, `UpdateReportRequest` |
| **Resources** | `{Model}Resource` | `UserResource`, `ReportResource` |
| **Enums** | Descriptive PascalCase | `Role`, `Status`, `DeviceStatus` |
| **Traits** | Adjective/Capability | `Filterable`, `HasLeaderboard`, `Togglable` |
| **Jobs** | Verb + Noun + `Job` | `SendNotificationJob`, `ProcessReportJob` |

### Variables & Methods

```php
// Variables: camelCase
$userData = [];
$isActive = true;

// Methods: camelCase verbs
public function createUser(array $data): User { }
public function hasPermission(string $permission): bool { }

// Scopes: scope + PascalCase
public function scopeActive(Builder $query): Builder { }
public function scopeFilters(Builder $query): Builder { }

// Relationships: camelCase
public function company(): BelongsTo { }
public function reports(): HasMany { }

// Attributes: camelCase
protected function fullName(): Attribute
{
    return Attribute::make(
        get: fn () => "{$this->first_name} {$this->last_name}"
    );
}
```

---

## Database & Migrations

### Migration Field Ordering (CRITICAL)

**ALWAYS follow this exact order:**

1. `id` (primary key)
2. Foreign keys (e.g., `user_id`, `company_id`)
3. Tiny integers for enums (e.g., `status`, `type`)
4. All other fields (strings, text, integers, decimals, etc.)
5. Boolean fields
6. Date/DateTime fields
7. Laravel timestamps (`timestamps()`, `softDeletes()`)

### Migration Example

```php
Schema::create('devices', function (Blueprint $table) {
    // 1. Primary key
    $table->id();

    // 2. Foreign keys
    $table->foreignId('company_id')->constrained();
    $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

    // 3. Enums (tinyInteger)
    $table->tinyInteger('status')->default(1);
    $table->tinyInteger('type')->default(1);

    // 4. Other fields
    $table->string('serial_number')->unique();
    $table->string('name');
    $table->text('description')->nullable();
    $table->decimal('latitude', 10, 8);
    $table->integer('battery_percentage')->default(100);

    // 5. Booleans
    $table->boolean('is_active')->default(true);

    // 6. Date fields (use dateTime, NOT timestamp)
    $table->dateTime('last_sync_at')->nullable();
    $table->dateTime('approved_at')->nullable();

    // 7. Timestamps
    $table->timestamps();
    $table->softDeletes(); // if using soft deletes

    // Indexes
    $table->index(['company_id', 'is_active']);
    $table->index('serial_number');
});
```

### Migration Rules

**DO:**
- ✅ Use `dateTime()` for all date fields
- ✅ Add indexes for frequently queried columns
- ✅ Use `nullable()` when appropriate
- ✅ Define foreign key constraints explicitly

**DON'T:**
- ❌ Use `timestamp()` - always use `dateTime()`
- ❌ Use `cascadeOnDelete()` unless project requires it
- ❌ Forget to add `_at` suffix to date columns

---

## Models

### Model Structure (Follow This Order)

```php
<?php

namespace App\Models;

use App\Enums\Status;
use App\Traits\Filterable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * @property int $id
 * @property int $company_id
 * @property string $name
 * @property Status $status
 * @property bool $is_active
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read Company $company
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Device> $devices
 */
class Product extends Model
{
    use Filterable;
    use HasFactory;
    use SoftDeletes;

    // ===== 1. Properties =====

    protected $fillable = [
        'company_id',
        'name',
        'description',
        'status',
        'is_active',
    ];

    protected $casts = [
        'status' => Status::class,
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $hidden = [
        'deleted_at',
    ];

    // ===== 2. Boot Method (if needed) =====

    protected static function booted(): void
    {
        static::creating(function (Product $product) {
            if (!$product->company_id) {
                $product->company_id = auth()->user()?->company_id;
            }
        });
    }

    // ===== 3. Relationships =====

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function devices(): HasMany
    {
        return $this->hasMany(Device::class);
    }

    // ===== 4. Scopes =====

    public function scopeFilters(Builder $query): Builder
    {
        return $query
            ->search(['name', 'description'])
            ->filterFromRequest('status')
            ->filterBoolFromRequest('is_active')
            ->sortFromRequest();
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    // ===== 5. Attributes =====

    protected function displayName(): Attribute
    {
        return Attribute::make(
            get: fn () => strtoupper($this->name)
        );
    }

    // ===== 6. Helper Methods =====

    public function activate(): void
    {
        $this->update(['is_active' => true]);
    }
}
```

### Model Traits Reference

| Trait | Usage | Required Property |
|-------|-------|-------------------|
| **Filterable** | Search/filter/sort (includes Sortable+Searchable) | - |
| **Togglable** | `$model->toggle('field')` | - |
| **HasRole** | `$user->hasRole(Role::ADMIN)` | - |
| **Loggable** | Spatie activity log | Override `getLoggableNameKey()` |
| **HasFileFields** | Auto-delete files on model delete | `$casts = ['file' => File::class]` |
| **IsTimezoneAware** | Converts client TZ to UTC | `$timezoneAwareDates = []` |
| **CascadeSoftDeletes** | Cascade soft deletes | `$cascadeDeletesOn = []` |
| **HasAttributeDefaults** | Set defaults on create | `$attributeDefaults = []` |
| **WithinCompany** | Scope by company_id | - |

### Common Casts

```php
protected $casts = [
    // Enums
    'status' => Status::class,
    'role_id' => Role::class,

    // Booleans
    'is_active' => 'boolean',

    // Dates
    'approved_at' => 'datetime',
    'scheduled_at' => 'datetime',

    // JSON
    'metadata' => 'array',
    'locale' => 'array',

    // Decimals
    'price' => 'decimal:2',
    'latitude' => 'decimal:8',

    // Files (if using custom File cast)
    'avatar' => File::class,
];
```

### N+1 Query Prevention

```php
// ✅ Correct - eager loading
$users = User::with(['company', 'devices'])->get();

// ✅ Correct - conditional eager loading
$users = User::with([
    'reports' => fn($q) => $q->where('status', Status::APPROVED),
])->get();

// ❌ Wrong - N+1 query
$users = User::all();
foreach ($users as $user) {
    echo $user->company->name; // Query for each user!
}
```

---

## Enums

### Enum Structure

**ALWAYS use integer-backed Enums starting at 1:**

```php
<?php

namespace App\Enums;

enum Status: int
{
    use HasEnumHelpers;

    case PENDING = 1;
    case APPROVED = 2;
    case REJECTED = 3;

    /**
     * Get human-readable label
     */
    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'Pending',
            self::APPROVED => 'Approved',
            self::REJECTED => 'Rejected',
        };
    }

    /**
     * Get color for UI
     */
    public function color(): string
    {
        return match ($this) {
            self::PENDING => 'yellow',
            self::APPROVED => 'green',
            self::REJECTED => 'red',
        };
    }

    /**
     * Business logic methods
     */
    public function canBeEdited(): bool
    {
        return in_array($this, [self::PENDING, self::REJECTED]);
    }
}
```

### Enum Usage

```php
// In migrations
$table->tinyInteger('status')->default(Status::PENDING->value);

// In models
protected $casts = [
    'status' => Status::class,
];

// In queries
Device::where('status', Status::APPROVED)->get();

// In code
if ($report->status === Status::APPROVED) {
    // Do something
}

if ($report->status->canBeEdited()) {
    // Allow editing
}
```

---

## Validation with Ruly

### Ruly Helper Class

**Location**: `app/Classes/Utilities/Ruly.php`

**ALWAYS use Ruly for validation rules. This is MANDATORY.**

### Basic Ruly Usage

```php
use App\Classes\Utilities\Ruly;

// Required field
Ruly::make(true)->fullString()->assign()

// Optional field
Ruly::make(false)->email()->assign()

// No constraint (nullable)
Ruly::make()->string()->assign()
```

### Common Ruly Patterns

```php
// Strings
'name' => Ruly::make(true)->fullString()->assign(), // required string max 255
'description' => Ruly::make(false)->text()->assign(), // nullable text max 65535
'code' => Ruly::make(true)->string()->min(3)->max(10)->assign(),

// Integers and Numbers
'age' => Ruly::make(true)->integer()->min(18)->max(100)->assign(),
'price' => Ruly::make(true)->decimal(2)->assign(),
'quantity' => Ruly::make(true)->numeric()->between(1, 999)->assign(),

// Booleans
'is_active' => Ruly::make(false)->boolean()->assign(),

// Enums
'status' => Ruly::make(true)->integer()->enum(Status::class)->assign(),
'role_id' => Ruly::make(true)->integer()->enum(Role::class)->assign(),

// Emails and Phones
'email' => Ruly::make(true)->email()->assign(),
'phone' => Ruly::make(true)->phone('+381')->min(9)->max(15)->assign(),

// Dates
'start_date' => Ruly::make(true)->date()->assign(),
'end_date' => Ruly::make(true)->date()->after('start_date')->assign(),
'birth_date' => Ruly::make(true)->date()->before('today')->assign(),

// Arrays
'tags' => Ruly::make(false)->array()->assign(),
'tags.*' => Ruly::make()->string()->max(50)->assign(),
'locale' => Ruly::make()->localizedArray()->assign(), // all app locales required

// Files and Images
'avatar' => Ruly::make(false)->image()->assign(), // jpeg,jpg,png,webp max 2MB
'logo' => Ruly::make(false)->image(['png', 'svg'], 5120)->assign(), // 5MB
'document' => Ruly::make(true)->file()->mimes('pdf', 'doc', 'docx')->assign(),
'video' => Ruly::make(false)->video()->assign(),

// Exists and Unique
'company_id' => Ruly::make(true)
    ->integer()
    ->exists('companies', 'id')
    ->assign(),

'email' => Ruly::make(true)
    ->email()
    ->unique('users', 'email', fn($rule) => $rule->ignore($userId))
    ->assign(),

// Conditional Rules
'manager_id' => Ruly::make()
    ->requiredIf($this->boolean('is_manager'))
    ->integer()
    ->exists('users', 'id')
    ->assign(),

'backup_email' => Ruly::make()
    ->requiredWith('receive_notifications')
    ->email()
    ->assign(),

// Passwords
'password' => Ruly::make(true)->password()->assign(), // min 8, mixed case, symbols
'password' => Ruly::make(true)->password(12)->confirmed()->assign(),

// Custom Rules
'discount' => Ruly::make(true)
    ->numeric()
    ->when(
        $this->input('type') === 'percentage',
        fn($ruly) => $ruly->max(100),
        fn($ruly) => $ruly->max(999999)
    )
    ->assign(),
```

### FormRequest Structure (LocalizedFormRequest)

**ALWAYS extend `LocalizedFormRequest` (NOT `FormRequest`)**

```php
<?php

namespace App\Http\Requests\User\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Enums\Role;
use App\Models\User;

class StoreUserRequest extends LocalizedFormRequest
{
    protected string|null $routeModelKey = 'user'; // For model binding
    protected bool $shouldUnpackDataKey = true; // Unwraps 'data' field

    public function authorize(): bool
    {
        return $this->user()->isAdmin();
    }

    public function rules(): array
    {
        return [
            'name' => Ruly::make(true)
                          ->fullString()
                          ->assign(),
            'email' => Ruly::make(true)
                            ->email()
                            ->unique(User::class, 'email')
                            ->assign(),
            'password' => Ruly::make(true)
                              ->password()
                              ->confirmed()
                              ->assign(),
            'role_id' => Ruly::make(true)
                             ->integer()
                             ->enum(Role::class)
                             ->assign(),
            'is_active' => Ruly::make(false)
                               ->boolean()
                               ->assign(),

            // Nested validation
            'profile' => Ruly::make(false)
                             ->array()
                             ->assign(),
            'profile.bio' => Ruly::make(false)
                                 ->text()
                                 ->assign(),
        ];
    }

    public function attributes(): array
    {
        return [
            'role_id' => 'role',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'company_id' => auth()->user()->company_id,
        ]);
    }
}
```

### Update Request Pattern

```php
class UpdateUserRequest extends LocalizedFormRequest
{
    public function rules(): array
    {
        $user = $this->route('user');

        return [
            'name' => Ruly::make()
                          ->sometimes()
                          ->fullString()
                          ->assign(),
            'email' => Ruly::make()
                           ->sometimes()
                           ->fullString()
                           ->email()
                           ->uniqueWithIgnore('users', 'email', $user)
                           ->assign(),
        ];
    }
}
```

### Custom Rule Classes

**Only for extremely complex validation that can't be expressed with Ruly:**

```php
<?php

namespace App\Rules;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Database\Eloquent\Builder;

class UniqueSkuForCompany implements ValidationRule
{
    public function __construct(
        private int $companyId,
        private int|null $ignoreId = null
    )
    {
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        $exists = Product::where('company_id', $this->companyId)
                         ->whereSku($value)
                         ->when($this->ignoreId, fn(Builder|Product $query) => $query
                             ->whereNot('id', $this->ignoreId))
                         ->exists();

        if ($exists) {
            $fail('The :attribute is already taken for this company.');
        }
    }
}

// Usage
'sku' => Ruly::make(true)
             ->fullString(5000)
             ->custom(new UniqueSkuForCompany(auth()->user()->company_id))
             ->assign(),
```

---

## Actions Pattern

### Action Organization

```
app/Actions/
├── User/
│   ├── Admin/
│   │   ├── CreateUserAction.php
│   │   ├── UpdateUserAction.php
│   │   └── DeleteUserAction.php
│   └── App/
│       └── RegisterUserAction.php
└── Shared/
    ├── ProcessFileAction.php
    └── SendNotificationAction.php
```

### Action Structure

```php
<?php

namespace App\Actions\User\Admin;

use App\Models\User;
use App\Traits\Core\AsAction;

class CreateUserAction
{
    use AsAction;

    public function handle(array $data): User
    {
        $data['company_id'] = auth()->user()->company_id;

        $user = User::store($data, true);

        // Additional business logic
        Mail::to($user)->send(new SendNewUserPassword($data['password']));

        return $user;
    }
}
```

### Action with Dependencies

```php
<?php

namespace App\Actions\Report\Admin;

use App\Models\Report;
use App\Services\NotificationService;
use App\Traits\Core\AsAction;

class ApproveReportAction
{
    use AsAction;

    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function handle(Report $report): Report
    {
        $report->patch([
            'status' => Status::APPROVED,
            'approved_by' => auth()->id(),
            'approved_at' => now(),
        ]);

        $this->notificationService->notifyReportApproved($report);

        return $report->fresh();
    }
}
```

### Using Actions in Controllers

```php
// ALWAYS use make() method (provided by AsAction trait)
$user = CreateUserAction::make()->handle($request->validated());

// With dependencies (automatically resolved)
$report = ApproveReportAction::make()->handle($report);
```

---

## Controllers

### Controller Pattern (Thin Controllers)

**Controllers should ONLY handle request/response flow. Delegate ALL business logic to Actions.**

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Actions\User\Admin\CreateUserAction;
use App\Actions\User\Admin\UpdateUserAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\Admin\StoreUserRequest;
use App\Http\Requests\User\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index(Request $request)
    {
        $users = User::query()
                     ->filters()
                     ->with(['company', 'role'])
                     ->paginate($request->input('per_page', 15));

        return response()->success(
            message: __('users_retrieved_successfully'),
            pagination: generate_pagination_data($users),
            data: UserResource::collection($users->items())
        );
    }

    /**
     * Store a newly created user.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = CreateUserAction::make()->handle($request->validated());
        $user->load(['company']);

        return response()->success(
            message: __('user_created_successfully'),
            data: UserResource::make($user)
        );
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): JsonResponse
    {
        $user->load(['company', 'role']);

        return response()->success(
            data: UserResource::make($user)
        );
    }

    /**
     * Update the specified user.
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = UpdateUserAction::make()->handle($user, $request->validated());
        $user->load(['company']);

        return response()->success(
            message: __('user_updated_successfully'),
            data: new UserResource($user)
        );
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->success(
            message: __('user_deleted_successfully')
        );
    }
}
```

---

## API Resources & Responses

### API Resource Structure

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->whenHas('name'),
            'email' => $this->whenHas('email'),
            'role' => $this->whenHas('role', fn () => $this->role->label()),
            'is_active' => $this->whenHas('is_active'),
            'created_at' => $this->whenHas('created_at'),

            // Conditional fields
            'company' => CompanyResource::make($this->whenLoaded('company')),
            'devices' => DeviceResource::collection($this->whenLoaded('devices')),

            // Computed fields
            'full_name' => $this->when(
                condition: (
                    array_key_exists('first_name', $this->attributes) &&
                    array_key_exists('last_name', $this->attributes)
                ),
                value: fn () => $this->full_name
            ),
            'avatar_url' => $this->when(
                condition: $this->relationLoaded('avatar') && $this->avatar?->hasAttribute('url'),
                value: fn () => $this->avatar_url
            ),
        ];
    }
}
```

### Response Macros (MANDATORY)

**NEVER use `response()->json()` directly. ALWAYS use custom response macros.**

**Location**: `app/Classes/Macros.php`

```php
// Success response (200 OK)
return response()->success(
    message: 'User created successfully',
    data: new UserResource($user)
);

// Success with pagination (REQUIRED for paginated endpoints)
return response()->success(
    pagination: generate_pagination_data($users),
    data: UserResource::collection($users->items())
);

// Success with only data
return response()->success(
    data: UserResource::collection($users)
);

// Success with only message
return response()->success(
    message: 'User deleted successfully'
);

// Unauthorized response (401)
return response()->unauthorized('You are not authorized');

// Unprocessable response (422)
return response()->unprocessable('Invalid data provided');

// Unexpected error response (500)
return response()->unexpectedError();
```

### Pagination Helper (MANDATORY)

**ALWAYS use `generate_pagination_data()` for paginated responses:**

```php
$users = User::query()->filters()->paginate(15);

return response()->success(
    data: UserResource::collection($users->items()),
    pagination: generate_pagination_data($users)
);

// Returns:
// {
//   "data": [...],
//   "pagination": {
//     "total": 100,
//     "per_page": 15,
//     "current_page": 1,
//     "total_pages": 7
//   }
// }
```

---

## Filterable Pattern

### Filterable Trait

**ALWAYS include `Filterable` trait in models with index endpoints.**

```php
use App\Traits\Filterable;

class Product extends Model
{
    use Filterable;

    public function scopeFilters(Builder $query): Builder
    {
        return $query
            ->search(['name', 'sku', 'description'])
            ->filterFromRequest('status')
            ->filterBoolFromRequest('is_active')
            ->filterWhereInFromRequest('category_ids', 'category_id')
            ->sortFromRequest();
    }
}
```

### Common Filter Methods

```php
// Text search (LIKE query)
->search(['name', 'description'], 'search')

// Exact match filter
->filterFromRequest('status')

// WhereIn filter
->filterWhereInFromRequest('category_ids', 'category_id')

// Boolean filter
->filterBoolFromRequest('is_active')

// Date range filter
->conditionallyFilterDateBetween($dateFrom, $dateTo, 'created_at')
->conditionallyFilterDateBetween(date_from(), date_to(), 'created_at') // Using helpers

// Sort
->sortFromRequest('sort', 'order', ['name', 'created_at'])

// Active scope
->active()

// For authenticated user
->forAuthUser()

// Search in relations
->searchWhereHas('relation', ['col1', 'col2'])

// Search in JSON columns
->searchJsonAttributes(['locale'], ['name', 'description'])
```

### Controller Usage

```php
public function index(Request $request): JsonResponse
{
    $products = Product::query()
                       ->with(['category', 'company'])
                       ->filters()
                       ->paginate($request->input('per_page', 15));

    return response()->success(
        pagination: generate_pagination_data($products),
        data: ProductResource::collection($products->items())
    );
}
```

---

## Localization

### Localization Strategy

Multi-language support is built-in. Content is stored in localized JSON columns.

### Middleware

`SetClientLocale` middleware sets the app locale from `X-Client-Locale` header.

**Required Headers:**
```
Accept: application/json
Content-Type: application/json
X-Client-Locale: sr|cyr|en
X-Client-Timezone: Europe/Belgrade
Authorization: Bearer {token}
```

### Localized Models

```php
// Models with JSON locale columns
protected $casts = [
    'locale' => 'array',
];

// Access localized attributes
$product->locale['en']['name']
$product->locale['sr']['description']
```

### Helper Functions

```php
// Localization helpers
__n($key, $count)           // Plural
__lc($key)                  // Lowercase
__uc($key)                  // Uppercase

// Date helpers
date_from()                 // Parse date from request
date_to()                   // Parse date to request

// Storage helpers
storage_url($path)          // Public URL
spa_url($path)             // SPA URL

// Utilities
normalize_name($str)        // Ucwords + trim
translateCyrToLat($text)
get_array_from_string($str) // CSV to array
clamp($val, $min, $max)
random_serial_number($len)
```

---

## File & Image Handling

### Image Processing Action

**ALWAYS use dedicated Action class for file/image processing:**

```php
<?php

namespace App\Actions\Shared;

use Intervention\Image\Laravel\Facades\Image;
use Illuminate\Http\UploadedFile;

class ProcessFileAction
{
    public function handle(UploadedFile $file, string $path = 'uploads'): string
    {
        $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();

        $image = Image::read($file);
        $image->resize(800, 600, function ($constraint) {
            $constraint->aspectRatio();
            $constraint->upsize();
        });

        $fullPath = storage_path("app/public/{$path}/{$filename}");
        $image->save($fullPath);

        return "{$path}/{$filename}";
    }
}
```

### File Storage Structure

```
storage/
├── app/
│   ├── public/              # Publicly accessible files
│   │   ├── uploads/         # General uploads
│   │   ├── avatars/         # User avatars
│   │   └── documents/       # Documents
│   └── private/             # Private files
```

### File Cast (Optional)

```php
// In Model
protected $casts = [
    'avatar' => File::class,
];

protected $cascadeFileFields = ['avatar']; // Auto-delete on model deletion
```

---

## Queue System

### Queue Configuration

**Development:**
```env
QUEUE_CONNECTION=sync
```

**Production:**
```env
QUEUE_CONNECTION=database
```

### Job Structure

```php
<?php

namespace App\Jobs;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendWelcomeEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        private User $user
    ) {}

    public function handle(): void
    {
        $this->user->notify(new WelcomeNotification());
    }
}
```

### Dispatching Jobs

```php
SendWelcomeEmailJob::dispatch($user);
SendWelcomeEmailJob::dispatch($user)->delay(now()->addMinutes(5));
SendWelcomeEmailJob::dispatch($user)->onQueue('emails');
```

---

## Multi-Tenancy

### WithinCompany Trait

**Common pattern: Scope all queries by `company_id`**

```php
<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait WithinCompany
{
    protected static function bootWithinCompany(): void
    {
        // Auto-scope queries
        static::addGlobalScope('company', function (Builder $builder) {
            if (auth()->check() && !auth()->user()->isSuperAdmin()) {
                $builder->where('company_id', auth()->user()->company_id);
            }
        });

        // Auto-set company_id on creation
        static::creating(function ($model) {
            if (!$model->company_id && auth()->check()) {
                $model->company_id = auth()->user()->company_id;
            }
        });
    }

    public function scopeForCompany(Builder $query, int $companyId): Builder
    {
        return $query->where('company_id', $companyId);
    }

    public function scopeInAllCompanies(Builder $query): Builder
    {
        return $query->withoutGlobalScope('company');
    }
}
```

### Usage

```php
class Device extends Model
{
    use WithinCompany;
}

// Automatically scoped to auth user's company
$devices = Device::all();

// SuperAdmin accessing all companies
$allDevices = Device::inAllCompanies()->get();

// Specific company
$companyDevices = Device::forCompany($companyId)->get();
```

---

## Testing

### Test Structure (Pest)

```php
<?php

use App\Models\User;
use App\Enums\Role;

test('admin can create user', function () {
    $admin = User::factory()->create(['role' => Role::ADMIN]);
    $data = [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
    ];

    $this->actingAs($admin)
        ->postJson('/api/admin/users', $data)
        ->assertStatus(201)
        ->assertJsonStructure(['data' => ['id', 'name']]);

    $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
});
```

---

## Code Style

### PSR-12 Compliance

**Use Laravel Pint for automatic formatting:**

```bash
./vendor/bin/pint
```

### Formatting Rules

- **Indentation**: 4 spaces (tabs)
- **Arrays**: Always use short syntax `[]` with trailing commas
- **Boolean/Null**: Use lowercase (`true`, `false`, `null`)
- **Braces**: Force braces for all control structures
- **Type Casting**: Add space after type cast: `(int) $value`
- **Short Closures**: Add space: `fn () => ...`

### Import Organization

```php
<?php

namespace App\Models;

// Framework imports first (alphabetical)
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

// Application imports (alphabetical)
use App\Enums\Status;
use App\Traits\Filterable;
```

### Array Syntax

```php
// ✅ Correct - short syntax with trailing commas
$data = [
    'name' => 'John',
    'email' => 'john@example.com',
    'phone' => '123456789',
];

// ❌ Wrong
$data = array('name' => 'John');
```

### Type Hints (MANDATORY)

```php
// ✅ Correct
public function createUser(array $data): User
{
    return User::create($data);
}

public function findUser(int $id): User|null
{
    return User::find($id);
}

// ❌ Wrong - no type hints
public function createUser($data)
{
    return User::create($data);
}
```

### Early Returns

```php
// ✅ Correct
public function process(Order $order): bool
{
    if (!$order->isPaid()) {
        return false;
    }

    if ($order->total <= 0) {
        return false;
    }

    // Process
    return true;
}

// ❌ Wrong - nested
public function process(Order $order): bool
{
    if ($order->isPaid()) {
        if ($order->total > 0) {
            return true;
        }
    }

    return false;
}
```

---

## Common Commands

### Development

```bash
# Start server
php artisan serve

# Queue worker (dev - auto-reload)
php artisan queue:listen

# Queue worker (production)
php artisan queue:work --sleep=3 --tries=3
```

### Database

```bash
# Fresh migration with seeding
php artisan migrate:fresh --seed

# Run migrations
php artisan migrate

# Create storage symlink
php artisan storage:link
```

### Code Quality

```bash
# Format code
./vendor/bin/pint

# Static analysis
./vendor/bin/phpstan analyse

# PHP Insights
php artisan insights

# IDE helpers
php artisan ide-helper:generate
php artisan ide-helper:models
```

### Testing

```bash
# Run all tests
php artisan test

# Run specific test
php artisan test --filter=TestName
```

### Cache

```bash
# Clear all
php artisan optimize:clear

# Clear specific
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

---

## Common Mistakes

| ❌ Wrong | ✅ Right |
|---------|---------|
| `extends FormRequest` | `extends LocalizedFormRequest` |
| `return UserResource::collection($users)` | `['data' => ..., 'pagination' => generate_pagination_data($users)]` |
| `User::search()->get()` | `User::query()->filters()->get()` |
| Manual file deletion | `use HasFileFields;` |
| `protected $casts = ['date' => 'datetime']` | `use IsTimezoneAware; $timezoneAwareDates = ['date']` |
| `Post::all(); $post->user->name` | `Post::with('user')->get()` |
| `['required', 'string']` | `Ruly::make(true)->fullString()->assign()` |
| `response()->json([...])` | `response()->success(data: ...)` |
| `Resource::make($item)` | `new Resource($item)` |
| `enum Status: string` | `enum Status: int` |
| `case PENDING = 0` | `case PENDING = 1` |

---

## AI Assistant Workflow

### Code Analysis First

Before creating or modifying code:

1. **Read related files** to understand existing patterns
2. **Check for similar implementations** to maintain consistency
3. **Review the domain structure** (Actions, Requests, Resources)
4. **Identify reusable components** (Traits, Actions, Services)

### Feature Creation Workflow

1. ✅ Identify the domain/model
2. ✅ Create migration with proper field ordering
3. ✅ Create Model with `$fillable`, `$casts`, `Filterable` trait
4. ✅ Create Enum if needed (integer-backed, start at 1, `HasEnumHelpers` trait)
5. ✅ Create FormRequest extending `LocalizedFormRequest` (use Ruly with `assign()`)
6. ✅ Create API Resource for responses
7. ✅ Create Action class for business logic (`AsAction` trait, type hints)
8. ✅ Create thin Controller that delegates to Action
9. ✅ Add routes to appropriate file
10. ✅ Add PHPDoc comments and type hints to all methods
11. ✅ Test manually via API client

### Code Quality Checklist

- [ ] No N+1 queries (eager loading used)
- [ ] All responses use API Resources
- [ ] All responses use response macros (NOT `response()->json()`)
- [ ] Single resources use `new Resource()` not `Resource::make()`
- [ ] FormRequest extends `LocalizedFormRequest`
- [ ] FormRequest uses Ruly with `assign()` method
- [ ] Enums are integer-backed, start at 1, include `HasEnumHelpers`
- [ ] Models have `Filterable`, `$fillable`, `$casts`
- [ ] Model sections properly ordered
- [ ] Date columns end with `_at` and use `dateTime()`
- [ ] Business logic in Actions (thin controllers)
- [ ] Actions include `AsAction` trait and called with `make()`
- [ ] Type hints AND return types on ALL methods
- [ ] PHPDoc comments added
- [ ] No security vulnerabilities

### Decision Trees

**Use Actions when:**
- Logic > 20 lines
- Logic is reused
- Multiple models involved
- External APIs called
- Complex operations

**Use Controller directly when:**
- Simple CRUD
- Just `->paginate()` and return resource

**Use Traits when:**
- Reusable across unrelated models
- Template provides it

---

## Debugging

**"Class not found"**
```bash
composer dump-autoload && php artisan config:clear
```

**Changes not reflecting**
```bash
php artisan config:clear && php artisan cache:clear
```

**N+1 queries**
```php
DB::enableQueryLog();
dd(DB::getQueryLog());
// Or use Clockwork
```

**Queue issues**
```bash
php artisan queue:failed
php artisan queue:retry {id}
```

---

## Security & Performance

### Security
1. Validate all inputs (FormRequests)
2. Prevent SQL injection (Eloquent/parameter binding)
3. Hash passwords (`bcrypt()`)
4. Rate limit APIs
5. Never expose sensitive data
6. Sanitize file uploads

### Performance
1. Eager load relationships (prevent N+1)
2. Use database indexes
3. Cache expensive operations
4. Queue long-running tasks
5. Use pagination
6. Minimize database queries

---

## Resources

- **Laravel Docs**: https://laravel.com/docs
- **Larastarter Docs**: https://gitbook.itcentar.rs/backend/larastarter
- **Coding Standards**: https://gitbook.itcentar.rs/backend/coding-standards
- **PSR Standards**: https://www.php-fig.org/psr/

---

**Version:** 2.0 (Ultimate Edition)
**Last Updated:** 2025-01-31

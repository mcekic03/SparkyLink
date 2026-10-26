<?php

namespace App\Models;

use App\Enums\Role;
use App\Traits\Model\Filterable\Filterable;
use App\Traits\Model\Filterable\HasColumns;
use App\Traits\Model\HasRole;
use Eloquent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * App\Models\User
 *
 * @property int $id
 * @property Role $role_id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Role $role
 * @mixin Eloquent
 */
class User extends Authenticatable
{
    use Filterable;
    use HasApiTokens;
    use HasColumns;
    use HasFactory;
    use HasRole;
    use Notifiable;

    // ===== 1. Properties =====

    protected $fillable = [
        'role_id',
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'role_id' => Role::class,
        'password' => 'hashed',
        'email_verified_at' => 'datetime',
    ];

    // ===== 2. Scopes =====

    public function scopeWithoutMe(Builder|self $query): Builder|self
    {
        return $query->where('id', '!=', auth()->id());
    }

    public function scopeFilters(Builder|self $query): Builder|self
    {
        $searchableColumns = self::columns()->exceptColumns('id', 'password', 'role_id')->getColumns();

        return $query
            ->withoutMe()
            ->withoutSuperAdmins()
            ->filterEnumFromRequest(Role::class, databaseField: 'role_id')
            ->search($searchableColumns)
            ->sortFromRequest(onlyByFields: self::columns()->exceptColumns('password')->getColumns())
            ->initialSort();
    }

    // ===== 3. Helpers =====

    public function isAdmin(): bool
    {
        return $this->hasRole(Role::ADMIN);
    }

    public function isWorker(): bool
    {
        return $this->hasRole(Role::WORKER);
    }

    /**
     * Radnik ne vidi iznose, zaradu, uplate ni obracune (vidi Role::canViewFinances).
     */
    public function canViewFinances(): bool
    {
        return $this->role_id->canViewFinances();
    }
}

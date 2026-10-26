<?php

namespace App\Traits\Model;

use App\Enums\Role as RoleEnum;
use App\Models\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Support\Collection;

/**
 * This trait expect that there is Role enumeration defined and that role foreign key inside model(role_id usually)
 * is cast to that enumeration. Also, this enumeration needs to have slug method on it in order for all methods
 * defined in this trait to work properly. You can check 'app/Enums/Role` for an example enumeration.
 */
trait HasRole
{
    /**
     * Checks if resource has role of super admin.
     *
     * @return bool
     */
    public function isSuperAdmin(): bool
    {
        return $this->hasRole(RoleEnum::SUPER_ADMIN);
    }

    /**
     * Checks if resource has certain role.
     *
     * @param string|RoleEnum $role
     *
     * @return bool
     */
    public function hasRole(string|RoleEnum $role): bool
    {
        if (is_a($role, RoleEnum::class)) {
            return $this->role === $role;
        }

        return $this->role?->slug() === $role;
    }

    /**
     * Checks if resource has any of the provided roles.
     *
     * @param mixed $roles
     *
     * @return bool
     */
    public function hasAnyRole(mixed $roles): bool
    {
        $roles = is_array($roles) ? $roles : func_get_args();

        return (bool) collect($roles)->firstWhere(fn ($role) => $this->hasRole($role));
    }

    /**
     * Changes role for the current resource.
     * Returns false if role does not exist or something wrong happened during update action.
     *
     * @param string|RoleEnum $role
     *
     * @return bool
     */
    public function changeRole(string|RoleEnum $role): bool
    {
        if (is_string($role)) {
            $role = RoleEnum::fromSlug($role);
        }

        if (! Role::query()->where('id', $role->value)->exists()) {
            return false;
        }

        return $this->forceFill(['role_id' => $role])->save();
    }

    /**
     * Scope which retrieves results with roles specified.
     *
     * @param Builder $query
     * @param array|null $roles
     *
     * @return Builder
     */
    public function scopeRoles(Builder $query, ?array $roles): Builder
    {
        $roles = $this->castRolesArrayToEnumsCollection($roles);

        if ($roles->isEmpty()) {
            return $query;
        }

        return $query->whereIn('role_id', $roles);
    }

    /**
     * Scope which retrieves results without roles specified.
     *
     * @param Builder $query
     * @param array|null $roles
     *
     * @return Builder
     */
    public function scopeWithoutRoles(Builder $query, ?array $roles): Builder
    {
        $roles = $this->castRolesArrayToEnumsCollection($roles);

        if ($roles->isEmpty()) {
            return $query;
        }

        return $query->whereNotIn('role_id', $roles);
    }

    public function scopeWithoutSuperAdmins(Builder $query): Builder
    {
        if (auth()->user()?->hasRole(RoleEnum::SUPER_ADMIN)) {
            return $query;
        }

        return $query->where('role_id', '!=', RoleEnum::SUPER_ADMIN);
    }

    public function scopeLowerPrivilegedRoles(Builder $query, bool $includeSamePrivilegeRoles = false): Builder
    {
        if (auth()->user()?->hasRole(RoleEnum::SUPER_ADMIN)) {
            return $query;
        }

        $operator = $includeSamePrivilegeRoles ? '>=' : '>';

        return $query->where('role_id', $operator, auth()->user()->role_id);
    }

    /**
     * Casts array of roles in whichever format into collection of role enumeration objects.
     *
     * @param array|null $roles
     *
     * @return Collection
     */
    private function castRolesArrayToEnumsCollection(?array $roles): Collection
    {
        return collect($roles)
            ->filter(fn ($role) => is_string($role) || is_a($role, RoleEnum::class))
            ->map(fn ($role) => is_string($role) ? RoleEnum::fromSlug($role) : $role)
            ->filter();
    }

    /**
     * Provides access to underlying role enumeration in more expressive way.
     *
     * @return Attribute
     */
    protected function role(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->role_id,
        );
    }
}

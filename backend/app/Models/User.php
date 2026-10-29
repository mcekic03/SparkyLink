<?php

namespace App\Models;

use App\Enums\Role;
use App\Traits\Model\HasRole;
use Eloquent;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\HasApiTokens;

/**
 * Jedini nalog u sistemu: vlasnik (pravi ga migracija iz ADMIN_EMAIL i SECRET_PASSWORD).
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
    use HasApiTokens;
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
}

<?php

namespace App\Models;

use Eloquent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Kratka napomena na gradilistu.
 *
 * @property int $id
 * @property int $site_id
 * @property int|null $user_id
 * @property string $body
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User|null $user
 * @mixin Eloquent
 */
class SiteNote extends Model
{
    // ===== 1. Properties =====

    protected $fillable = [
        'site_id',
        'user_id',
        'body',
    ];

    // ===== 2. Relationships =====

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

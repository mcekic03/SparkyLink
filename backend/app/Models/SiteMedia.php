<?php

namespace App\Models;

use App\Enums\MediaType;
use Eloquent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

/**
 * Slika ili video snimak uz gradiliste (privatan fajl, prikaz preko potpisanog linka).
 *
 * @property int $id
 * @property int $site_id
 * @property int|null $user_id
 * @property MediaType $type
 * @property string $disk
 * @property string $path
 * @property string|null $thumbnail_path
 * @property string $original_name
 * @property string $mime_type
 * @property int $size
 * @property int|null $width
 * @property int|null $height
 * @property string|null $caption
 * @property Carbon|null $taken_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User|null $user
 * @mixin Eloquent
 */
class SiteMedia extends Model
{
    // ===== 1. Properties =====

    protected $fillable = [
        'site_id',
        'user_id',
        'type',
        'disk',
        'path',
        'thumbnail_path',
        'original_name',
        'mime_type',
        'size',
        'width',
        'height',
        'caption',
        'taken_at',
    ];

    protected $casts = [
        'type' => MediaType::class,
        'size' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
        'taken_at' => 'datetime',
    ];

    // ===== 2. Boot =====

    protected static function booted(): void
    {
        static::deleted(function (SiteMedia $media) {
            Storage::disk($media->disk)->delete(array_filter([$media->path, $media->thumbnail_path]));
        });
    }

    // ===== 3. Relationships =====

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

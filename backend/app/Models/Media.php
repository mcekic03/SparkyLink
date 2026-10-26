<?php

namespace App\Models;

use App\Enums\MediaType;
use App\Traits\Core\Mediable;
use Eloquent;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * App\Models\Media
 *
 * @property string $id
 * @property MediaType $type
 * @property string $path
 * @property string $url
 * @property string $filename
 * @property string $size
 * @property string $extension
 * @property int|null $width
 * @property int|null $height
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @method static Builder<static>|Media images()
 * @method static Builder<static>|Media newModelQuery()
 * @method static Builder<static>|Media newQuery()
 * @method static Builder<static>|Media query()
 * @method static Builder<static>|Media videos()
 * @method static Builder<static>|Media whereCreatedAt($value)
 * @method static Builder<static>|Media whereExtension($value)
 * @method static Builder<static>|Media whereFilename($value)
 * @method static Builder<static>|Media whereHeight($value)
 * @method static Builder<static>|Media whereId($value)
 * @method static Builder<static>|Media wherePath($value)
 * @method static Builder<static>|Media whereSize($value)
 * @method static Builder<static>|Media whereType($value)
 * @method static Builder<static>|Media whereUpdatedAt($value)
 * @method static Builder<static>|Media whereUrl($value)
 * @method static Builder<static>|Media whereWidth($value)
 * @mixin Eloquent
 */
class Media extends Model
{
    use HasUuids;
    use Mediable;

    protected $fillable = [
        'type',
        'path',
        'url',
        'filename',
        'size',
        'extension',
        'width',
        'height',
    ];

    protected $casts = [
        'type' => MediaType::class,
    ];
}

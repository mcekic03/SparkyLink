<?php

namespace App\Models;

use App\Enums\FuseRating;
use App\Enums\FuseType;
use Eloquent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * Jedan osigurac na tabli.
 *
 * @property int $id
 * @property int $fuse_board_id
 * @property FuseType $type
 * @property FuseRating $rating
 * @property int $position redni broj na tabli
 * @property string $name sta napaja
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read FuseBoard $board
 * @mixin Eloquent
 */
class Fuse extends Model
{
    // ===== 1. Properties =====

    protected $fillable = [
        'fuse_board_id',
        'type',
        'rating',
        'position',
        'name',
    ];

    protected $casts = [
        'type' => FuseType::class,
        'rating' => FuseRating::class,
        'position' => 'integer',
    ];

    // ===== 2. Relationships =====

    public function board(): BelongsTo
    {
        return $this->belongsTo(FuseBoard::class, 'fuse_board_id');
    }
}

<?php

namespace App\Http\Requests\FuseBoard\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;
use App\Enums\FuseRating;
use App\Enums\FuseType;

/**
 * Tabla sa svim osiguracima odjednom, redom kojim su na tabli. Bez `fuses` (samo novi
 * naziv) osiguraci ostaju kakvi su.
 */
class FuseBoardRequest extends LocalizedFormRequest
{
    public function rules(): array
    {
        return [
            'name' => Ruly::make(true)->fullString()->assign(),
            'fuses' => Ruly::make(false)->array()->max(200)->assign(),
            'fuses.*.name' => Ruly::make(true)->fullString()->assign(),
            'fuses.*.type' => Ruly::make(true)->integer()->enum(FuseType::class)->assign(),
            'fuses.*.rating' => Ruly::make(true)->integer()->enum(FuseRating::class)->assign(),
        ];
    }

    public function attributes(): array
    {
        return [
            'name' => __('attribute_fuse_board_name'),
            'fuses' => __('attribute_fuses'),
            'fuses.*.name' => __('attribute_fuse_name'),
            'fuses.*.type' => __('attribute_fuse_type'),
            'fuses.*.rating' => __('attribute_fuse_rating'),
        ];
    }
}

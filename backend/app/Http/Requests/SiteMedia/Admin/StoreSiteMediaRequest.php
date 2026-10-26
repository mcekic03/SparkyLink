<?php

namespace App\Http\Requests\SiteMedia\Admin;

use App\Classes\LocalizedFormRequest;
use App\Classes\Utilities\Ruly;

/**
 * Jedan fajl po zahtevu (frontend salje redom, sa napretkom za svaki). Za video
 * pregledac salje i slicicu (prvi kadar), jer server ne prerađuje video.
 */
class StoreSiteMediaRequest extends LocalizedFormRequest
{
    public const IMAGE_MIMES = ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'];

    public const VIDEO_MIMES = ['mp4', 'mov', 'm4v', 'webm', '3gp', 'qt'];

    public function rules(): array
    {
        return [
            'file' => Ruly::make(true)
                          ->file((int) config('sparkylink.media.video_max_kb'))
                          ->mimes(...self::IMAGE_MIMES, ...self::VIDEO_MIMES)
                          ->assign(),
            'thumbnail' => Ruly::make(false)->image(['jpg', 'jpeg', 'png', 'webp'], 5120)->assign(),
            'caption' => Ruly::make(false)->fullString()->assign(),
            'taken_at' => Ruly::make(false)->date()->assign(),
        ];
    }
}

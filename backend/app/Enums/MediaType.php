<?php

namespace App\Enums;

use App\Traits\Core\HasEnumHelpers;

enum MediaType: int
{
    use HasEnumHelpers;

    case UNKNOWN = -1;

    case IMAGE = 1;

    case VIDEO = 2;

    case SVG = 3;

    case AUDIO = 4;

    public static function fromMimeType(string $mimeType): self
    {
        return match (true) {
            str_contains($mimeType, 'svg') => self::SVG,
            str_contains($mimeType, 'image') => self::IMAGE,
            str_contains($mimeType, 'video') => self::VIDEO,
            str_contains($mimeType, 'audio') => self::AUDIO,
            default => self::UNKNOWN
        };
    }
}

<?php

namespace App\Classes;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

abstract class TimezoneAwareResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = $this->fromArray($request);

        return collect($data)
            ->map(function (mixed $value, string $key) {
                if ($this->shouldConvert($value, $key)) {
                    return convert_to_client_timezone($value);
                }

                return $value;
            })
            ->toArray();
    }

    abstract protected function fromArray(Request $request): array;

    private function shouldConvert(mixed $value, string $key): bool
    {
        $casts = $this->resource->getCasts();

        return $value instanceof Carbon &&
            in_array($key, array_keys($casts)) &&
            $casts[$key] === 'datetime';
    }
}

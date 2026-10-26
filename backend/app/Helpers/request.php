<?php

use App\Enums\OrderDirection;

if (! function_exists('client_ip')) {
    /**
     * Generates a shortened day name from given date.
     *
     * @return string|array|null
     */
    function client_ip(): string|array|null
    {
        return request()->header('X-REAL-IP') ??
            request()->header('X-FORWARDED-FOR') ??
            request()->header('HTTP_X_REAL_IP') ??
            request()->ip();
    }
}

if (! function_exists('request_order')) {
    /**
     * Helper for getting sorting order from the request.
     *
     * @param string $requestKey
     * @param OrderDirection $defaultOrder
     *
     * @return string
     */
    function request_order(string $requestKey = 'order', OrderDirection $defaultOrder = OrderDirection::DESC): string
    {
        $requestValue = request($requestKey);

        $order = $requestValue
            ? OrderDirection::fromValue($requestValue)
            : $defaultOrder;

        return $order->value;
    }
}

if (! function_exists('request_ids')) {
    /**
     * Retrieves ids from request or fetches all ids from provided model.
     *
     * @param string $requestKey
     * @param string $modelClass
     *
     * @return array
     */
    function request_ids(string $requestKey, string $modelClass): array
    {
        $requestValue = request($requestKey);

        if (is_null($requestValue)) {
            return [];
        }

        if ($requestValue === config('request.fetch_all_records_key')) {
            return $modelClass::query()->pluck('id')->toArray();
        }

        $values = is_array($requestValue)
            ? $requestValue
            : explode(',', $requestValue);

        return array_map(
            fn ($value) => (int) $value,
            $values
        );
    }
}

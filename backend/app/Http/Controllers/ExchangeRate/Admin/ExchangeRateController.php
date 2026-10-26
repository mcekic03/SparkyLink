<?php

namespace App\Http\Controllers\ExchangeRate\Admin;

use App\Actions\ExchangeRate\Shared\ResolveExchangeRateAction;
use App\Enums\Currency;
use App\Enums\ExchangeRateSource;
use App\Http\Controllers\Controller;
use App\Http\Requests\ExchangeRate\Admin\ExchangeRateRequest;
use App\Http\Resources\ExchangeRateResource;
use App\Models\ExchangeRate;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;

class ExchangeRateController extends Controller
{
    /**
     * Poslednjih 60 sacuvanih kurseva.
     */
    public function index(): JsonResponse
    {
        $rates = ExchangeRate::query()
                             ->where('currency', Currency::EUR)
                             ->orderByDesc('effective_at')
                             ->limit(60)
                             ->get();

        return response()->success(data: ExchangeRateResource::collection($rates));
    }

    /**
     * Kurs za dan (YYYY-MM-DD) - forma ga popunjava pri unosu stavke/uplate. 422 kad ga nema.
     */
    public function show(string $date): JsonResponse
    {
        abort_unless((bool) preg_match('/^\d{4}-\d{2}-\d{2}$/', $date), 404);

        $rate = ResolveExchangeRateAction::make()->handle($date);

        return response()->success(data: ['date' => $date, 'currency' => Currency::EUR->value, 'rate' => $rate]);
    }

    /**
     * Rucno upisan kurs za dan (gazi preuzet; servis ga posle ne menja).
     */
    public function store(ExchangeRateRequest $request): JsonResponse
    {
        $rate = ExchangeRate::query()->updateOrCreate(
            [
                'currency' => Currency::EUR,
                'effective_at' => Carbon::createFromFormat('!Y-m-d', $request->validated('effective_at')),
            ],
            ['rate' => $request->validated('rate'), 'source' => ExchangeRateSource::MANUAL]
        );

        return response()->success(message: __('exchange_rate_saved'), data: new ExchangeRateResource($rate));
    }
}

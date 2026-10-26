<?php

namespace App\Http\Controllers\Payment\Admin;

use App\Actions\Payment\Admin\SavePaymentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\Admin\PaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Site;
use Illuminate\Http\JsonResponse;

class PaymentController extends Controller
{
    public function index(int $site): JsonResponse
    {
        $payments = Site::withTrashed()->findOrFail($site)
                        ->payments()
                        ->orderByDesc('paid_at')
                        ->orderByDesc('id')
                        ->get();

        return response()->success(data: PaymentResource::collection($payments));
    }

    public function store(PaymentRequest $request, Site $site): JsonResponse
    {
        $payment = SavePaymentAction::make()->handle($site, $request->validated());

        return response()->success(message: __('payment_created'), data: new PaymentResource($payment));
    }

    public function update(PaymentRequest $request, Payment $payment): JsonResponse
    {
        $payment = SavePaymentAction::make()->handle($payment->site, $request->validated(), $payment);

        return response()->success(message: __('payment_updated'), data: new PaymentResource($payment));
    }

    public function destroy(Payment $payment): JsonResponse
    {
        $payment->delete();

        return response()->success(message: __('payment_deleted'));
    }
}

<?php

namespace App\Http\Controllers\Receipt\Admin;

use App\Actions\Receipt\Admin\DeleteReceiptAction;
use App\Actions\Receipt\Admin\ImportReceiptItemsAction;
use App\Actions\Receipt\Admin\PreviewReceiptAction;
use App\Actions\Receipt\Admin\RefetchReceiptAction;
use App\Actions\Receipt\Admin\StoreReceiptAction;
use App\Enums\ReceiptStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Receipt\Admin\ImportReceiptItemsRequest;
use App\Http\Requests\Receipt\Admin\PreviewReceiptRequest;
use App\Http\Requests\Receipt\Admin\StoreReceiptRequest;
use App\Http\Resources\ReceiptResource;
use App\Models\Receipt;
use App\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    /**
     * Svi racuni (garancija): pretraga po prodavnici, PIB-u, broju i tekstu racuna.
     */
    public function index(Request $request): JsonResponse
    {
        $receipts = Receipt::query()
                           ->with('site:id,name')
                           ->withCount('items')
                           ->filters()
                           ->paginate($request->integer('per_page', 15));

        return response()->success(
            data: ReceiptResource::collection($receipts),
            pagination: generate_pagination_data($receipts)
        );
    }

    public function siteIndex(int $site): JsonResponse
    {
        $receipts = Site::withTrashed()->findOrFail($site)
                        ->receipts()
                        ->withCount('items')
                        ->orderByDesc('issued_at')
                        ->orderByDesc('id')
                        ->get();

        return response()->success(data: ReceiptResource::collection($receipts));
    }

    public function show(Receipt $receipt): JsonResponse
    {
        return response()->success(data: new ReceiptResource($receipt->load('site:id,name')->loadCount('items')));
    }

    /**
     * Pregled stavki sa racuna pre uvoza (nista se ne cuva).
     */
    public function preview(PreviewReceiptRequest $request, Site $site): JsonResponse
    {
        $preview = PreviewReceiptAction::make()->handle(
            $site,
            $request->validated('qr_url'),
            $request->boolean('transliterate', true)
        );

        return response()->success(message: $preview['message'] ?? null, data: $preview);
    }

    public function store(StoreReceiptRequest $request, Site $site): JsonResponse
    {
        $result = StoreReceiptAction::make()->handle($site, $request->validated(), $request->file('photo'));
        $receipt = $result['receipt'];

        $message = match ($receipt->status) {
            ReceiptStatus::FETCHED => __('receipt_imported', ['count' => $result['imported']]),
            ReceiptStatus::PENDING => __('receipt_saved_pending'),
            default => __('receipt_saved_manual'),
        };

        return response()->success(message: $message, data: new ReceiptResource($receipt->load('site:id,name')->loadCount('items')));
    }

    public function refetch(Receipt $receipt): JsonResponse
    {
        $receipt = RefetchReceiptAction::make()->handle($receipt);

        $message = $receipt->status === ReceiptStatus::FETCHED ? __('receipt_refetched') : __('receipt_fetch_failed');

        return response()->success(message: $message, data: new ReceiptResource($receipt->load('site:id,name')->loadCount('items')));
    }

    public function importItems(ImportReceiptItemsRequest $request, Receipt $receipt): JsonResponse
    {
        $count = ImportReceiptItemsAction::make()->handle($receipt, $request->validated('items'));

        return response()->success(message: __('receipt_imported', ['count' => $count]));
    }

    public function destroy(Receipt $receipt): JsonResponse
    {
        DeleteReceiptAction::make()->handle($receipt);

        return response()->success(message: __('receipt_deleted'));
    }
}

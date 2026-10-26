<?php

namespace App\Http\Controllers\SiteItem\Admin;

use App\Actions\SiteItem\Admin\ImportSiteItemsAction;
use App\Actions\SiteItem\Admin\ReadSpreadsheetItemsAction;
use App\Actions\SiteItem\Admin\SaveSiteItemAction;
use App\Actions\SiteItem\Admin\SetPurchasePricesAction;
use App\Enums\Currency;
use App\Http\Controllers\Controller;
use App\Http\Requests\SiteItem\Admin\ImportSiteItemsRequest;
use App\Http\Requests\SiteItem\Admin\PreviewSpreadsheetItemsRequest;
use App\Http\Requests\SiteItem\Admin\SetPurchasePricesRequest;
use App\Http\Requests\SiteItem\Admin\SiteItemRequest;
use App\Http\Resources\SiteItemResource;
use App\Models\Site;
use App\Models\SiteItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\UploadedFile;

class SiteItemController extends Controller
{
    /**
     * Sve stavke gradilista (filter po vrsti, pretraga), najnovije prve.
     */
    public function index(int $site): JsonResponse
    {
        $items = Site::withTrashed()->findOrFail($site)->items()->with('itemImport:id,file_name,created_at')->filters()->get();

        return response()->success(data: SiteItemResource::collection($items));
    }

    public function store(SiteItemRequest $request, Site $site): JsonResponse
    {
        $item = SaveSiteItemAction::make()->handle($site, $request->validated());

        return response()->success(message: __('item_created'), data: new SiteItemResource($item));
    }

    public function update(SiteItemRequest $request, SiteItem $item): JsonResponse
    {
        $item = SaveSiteItemAction::make()->handle($item->site, $request->validated(), $item);

        return response()->success(message: __('item_updated'), data: new SiteItemResource($item));
    }

    public function destroy(SiteItem $item): JsonResponse
    {
        $item->delete();

        return response()->success(message: __('item_deleted'));
    }

    /**
     * Stavke iz Excel fajlova prodavnice pre uvoza, posebno za svaki fajl (nista se ne cuva).
     */
    public function previewSpreadsheets(PreviewSpreadsheetItemsRequest $request, Site $site): JsonResponse
    {
        /** @var array<int, UploadedFile> $files */
        $files = $request->file('files');

        return response()->success(data: [
            'files' => array_map(fn (UploadedFile $file) => ReadSpreadsheetItemsAction::make()->handle($file), $files),
        ]);
    }

    public function import(ImportSiteItemsRequest $request, Site $site): JsonResponse
    {
        $count = ImportSiteItemsAction::make()->handle($site, $request->validated('occurred_at'), $request->validated('files'));

        return response()->success(message: __('spreadsheet_items_imported', ['count' => $count]));
    }

    /**
     * Nabavna cena za vise stavki odjednom: manje za procenat ili ukupno koliko je placeno.
     */
    public function setPurchasePrices(SetPurchasePricesRequest $request, Site $site): JsonResponse
    {
        $result = SetPurchasePricesAction::make()->handle(
            $site,
            $request->validated('item_ids'),
            $request->validated('percent'),
            $request->validated('total'),
            $request->filled('currency') ? Currency::from($request->integer('currency')) : null,
        );

        return response()->success(message: __('purchase_prices_set', ['count' => $result['count']]), data: $result);
    }
}

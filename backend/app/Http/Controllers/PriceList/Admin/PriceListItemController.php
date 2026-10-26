<?php

namespace App\Http\Controllers\PriceList\Admin;

use App\Actions\PriceList\Admin\ItemSuggestionsAction;
use App\Enums\ItemType;
use App\Http\Controllers\Controller;
use App\Http\Requests\PriceList\Admin\PriceListItemRequest;
use App\Http\Resources\PriceListItemResource;
use App\Models\PriceListItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PriceListItemController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = PriceListItem::query()->filters()->paginate($request->integer('per_page', 25));

        return response()->success(
            data: PriceListItemResource::collection($items),
            pagination: generate_pagination_data($items)
        );
    }

    public function store(PriceListItemRequest $request): JsonResponse
    {
        $item = PriceListItem::store($request->validated());

        return response()->success(message: __('price_list_item_created'), data: new PriceListItemResource($item));
    }

    public function update(PriceListItemRequest $request, PriceListItem $priceListItem): JsonResponse
    {
        $priceListItem->patch($request->validated());

        return response()->success(message: __('price_list_item_updated'), data: new PriceListItemResource($priceListItem));
    }

    public function destroy(PriceListItem $priceListItem): JsonResponse
    {
        $priceListItem->delete();

        return response()->success(message: __('price_list_item_deleted'));
    }

    /**
     * Predlozi za unos stavke (cenovnik + ranije stavke sa poslednjim cenama).
     */
    public function suggestions(Request $request): JsonResponse
    {
        $suggestions = ItemSuggestionsAction::make()->handle(
            (string) $request->input('search', ''),
            ItemType::tryFrom($request->integer('type'))
        );

        return response()->success(data: $suggestions);
    }
}

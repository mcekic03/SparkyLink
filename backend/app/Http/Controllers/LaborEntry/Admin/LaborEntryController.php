<?php

namespace App\Http\Controllers\LaborEntry\Admin;

use App\Actions\LaborEntry\Admin\SaveLaborEntryAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\LaborEntry\Admin\LaborEntryRequest;
use App\Http\Resources\LaborEntryResource;
use App\Models\LaborEntry;
use App\Models\Site;
use Illuminate\Http\JsonResponse;

class LaborEntryController extends Controller
{
    public function index(int $site): JsonResponse
    {
        $entries = Site::withTrashed()->findOrFail($site)
                       ->laborEntries()
                       ->orderByDesc('worked_at')
                       ->orderByDesc('id')
                       ->get();

        return response()->success(data: LaborEntryResource::collection($entries));
    }

    public function store(LaborEntryRequest $request, Site $site): JsonResponse
    {
        $entry = SaveLaborEntryAction::make()->handle($site, $request->validated());

        return response()->success(message: __('labor_created'), data: new LaborEntryResource($entry));
    }

    public function update(LaborEntryRequest $request, LaborEntry $laborEntry): JsonResponse
    {
        $entry = SaveLaborEntryAction::make()->handle($laborEntry->site, $request->validated(), $laborEntry);

        return response()->success(message: __('labor_updated'), data: new LaborEntryResource($entry));
    }

    public function destroy(LaborEntry $laborEntry): JsonResponse
    {
        $laborEntry->delete();

        return response()->success(message: __('labor_deleted'));
    }
}

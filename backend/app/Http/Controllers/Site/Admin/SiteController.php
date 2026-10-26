<?php

namespace App\Http\Controllers\Site\Admin;

use App\Actions\Site\Admin\BuildSiteSummaryAction;
use App\Actions\Site\Admin\SaveSiteAction;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Site\Admin\SiteRequest;
use App\Http\Resources\SiteResource;
use App\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteController extends Controller
{
    /**
     * Lista gradilista (pretraga, status radova, status naplate, obrisana).
     */
    public function index(Request $request): JsonResponse
    {
        $canViewFinances = $request->user()->canViewFinances();

        $sites = Site::query()
                     ->when($canViewFinances, fn ($query) => $query->withFinancials())
                     ->filters()
                     ->when(
                         $canViewFinances,
                         fn ($query) => $query->wherePaymentStatus(PaymentStatus::tryFrom((int) $request->input('payment_status')))
                     )
                     ->when($canViewFinances && $request->boolean('trashed'), fn ($query) => $query->onlyTrashed())
                     ->paginate($request->integer('per_page', 15));

        return response()->success(
            data: SiteResource::collection($sites),
            pagination: generate_pagination_data($sites)
        );
    }

    public function show(Request $request, int $site): JsonResponse
    {
        $model = Site::query()
                     ->when($request->user()->canViewFinances(), fn ($query) => $query->withTrashed()->withFinancials())
                     ->findOrFail($site);

        return response()->success(data: new SiteResource($model));
    }

    public function store(SiteRequest $request): JsonResponse
    {
        $site = SaveSiteAction::make()->handle($request->validated());

        return response()->success(message: __('site_created'), data: new SiteResource($site));
    }

    public function update(SiteRequest $request, Site $site): JsonResponse
    {
        $site = SaveSiteAction::make()->handle($request->validated(), $site);

        return response()->success(message: __('site_updated'), data: new SiteResource($site));
    }

    /**
     * Meko brisanje - stavke, racuni i dokumenti ostaju (moze da se vrati).
     */
    public function destroy(Site $site): JsonResponse
    {
        $site->delete();

        return response()->success(message: __('site_deleted'));
    }

    public function restore(int $site): JsonResponse
    {
        Site::onlyTrashed()->findOrFail($site)->restore();

        return response()->success(message: __('site_restored'));
    }

    public function summary(int $site): JsonResponse
    {
        $model = Site::withTrashed()->findOrFail($site);

        return response()->success(data: BuildSiteSummaryAction::make()->handle($model));
    }
}

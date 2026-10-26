<?php

namespace App\Http\Controllers\SiteMedia\Admin;

use App\Actions\SiteMedia\Admin\StoreSiteMediaAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\SiteMedia\Admin\StoreSiteMediaRequest;
use App\Http\Requests\SiteMedia\Admin\UpdateSiteMediaRequest;
use App\Http\Resources\SiteMediaResource;
use App\Models\Site;
use App\Models\SiteMedia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SiteMediaController extends Controller
{
    public function index(int $site): JsonResponse
    {
        $media = Site::withTrashed()->findOrFail($site)
                     ->media()
                     ->with('user:id,name')
                     ->latest()
                     ->get();

        return response()->success(data: SiteMediaResource::collection($media));
    }

    public function store(StoreSiteMediaRequest $request, Site $site): JsonResponse
    {
        $media = StoreSiteMediaAction::make()->handle(
            $site,
            $request->file('file'),
            $request->file('thumbnail'),
            $request->safe()->only(['caption', 'taken_at'])
        );

        return response()->success(message: __('media_uploaded'), data: new SiteMediaResource($media->load('user:id,name')));
    }

    public function update(UpdateSiteMediaRequest $request, SiteMedia $media): JsonResponse
    {
        $this->ensureCanModify($request, $media);

        $media->update($request->validated());

        return response()->success(message: __('media_updated'), data: new SiteMediaResource($media->load('user:id,name')));
    }

    public function destroy(Request $request, SiteMedia $media): JsonResponse
    {
        $this->ensureCanModify($request, $media);

        $media->delete();

        return response()->success(message: __('media_deleted'));
    }

    private function ensureCanModify(Request $request, SiteMedia $media): void
    {
        $user = $request->user();

        abort_unless($user->id === $media->user_id || $user->canViewFinances(), 404);
    }
}

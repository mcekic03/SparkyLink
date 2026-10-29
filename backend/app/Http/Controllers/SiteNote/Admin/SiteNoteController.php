<?php

namespace App\Http\Controllers\SiteNote\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SiteNote\Admin\SiteNoteRequest;
use App\Http\Resources\SiteNoteResource;
use App\Models\Site;
use App\Models\SiteNote;
use Illuminate\Http\JsonResponse;

class SiteNoteController extends Controller
{
    public function index(int $site): JsonResponse
    {
        $notes = Site::withTrashed()->findOrFail($site)
                     ->notes()
                     ->with('user:id,name')
                     ->latest()
                     ->get();

        return response()->success(data: SiteNoteResource::collection($notes));
    }

    public function store(SiteNoteRequest $request, Site $site): JsonResponse
    {
        $note = $site->notes()->create([...$request->validated(), 'user_id' => auth()->id()]);

        return response()->success(message: __('note_created'), data: new SiteNoteResource($note->load('user:id,name')));
    }

    public function update(SiteNoteRequest $request, SiteNote $note): JsonResponse
    {
        $note->update($request->validated());

        return response()->success(message: __('note_updated'), data: new SiteNoteResource($note->load('user:id,name')));
    }

    public function destroy(SiteNote $note): JsonResponse
    {
        $note->delete();

        return response()->success(message: __('note_deleted'));
    }
}

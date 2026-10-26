<?php

namespace App\Http\Controllers\SiteNote\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SiteNote\Admin\SiteNoteRequest;
use App\Http\Resources\SiteNoteResource;
use App\Models\Site;
use App\Models\SiteNote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
        $this->ensureCanModify($request, $note);

        $note->update($request->validated());

        return response()->success(message: __('note_updated'), data: new SiteNoteResource($note->load('user:id,name')));
    }

    public function destroy(Request $request, SiteNote $note): JsonResponse
    {
        $this->ensureCanModify($request, $note);

        $note->delete();

        return response()->success(message: __('note_deleted'));
    }

    /**
     * Tudju napomenu menja samo vlasnik/administrator; ostalima 404 (kao uloge u sablonu).
     */
    private function ensureCanModify(Request $request, SiteNote $note): void
    {
        $user = $request->user();

        abort_unless($user->id === $note->user_id || $user->canViewFinances(), 404);
    }
}

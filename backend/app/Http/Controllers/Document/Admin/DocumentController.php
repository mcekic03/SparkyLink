<?php

namespace App\Http\Controllers\Document\Admin;

use App\Actions\Document\Admin\CreateDocumentAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Document\Admin\StoreDocumentRequest;
use App\Http\Resources\DocumentResource;
use App\Models\Document;
use App\Models\Site;
use Illuminate\Http\JsonResponse;

class DocumentController extends Controller
{
    public function index(int $site): JsonResponse
    {
        $documents = Site::withTrashed()->findOrFail($site)
                         ->documents()
                         ->orderByDesc('issued_at')
                         ->orderByDesc('id')
                         ->get();

        return response()->success(data: DocumentResource::collection($documents));
    }

    public function store(StoreDocumentRequest $request, Site $site): JsonResponse
    {
        $document = CreateDocumentAction::make()->handle($site, $request->validated());

        return response()->success(
            message: __('document_created', ['title' => $document->type->label(), 'number' => $document->number]),
            data: new DocumentResource($document)
        );
    }

    public function destroy(Document $document): JsonResponse
    {
        $document->delete();

        return response()->success(message: __('document_deleted'));
    }
}

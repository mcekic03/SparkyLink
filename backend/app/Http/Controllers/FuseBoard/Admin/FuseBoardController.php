<?php

namespace App\Http\Controllers\FuseBoard\Admin;

use App\Actions\FuseBoard\Admin\SaveFuseBoardAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\FuseBoard\Admin\FuseBoardRequest;
use App\Http\Resources\FuseBoardResource;
use App\Models\Fuse;
use App\Models\FuseBoard;
use App\Models\Site;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class FuseBoardController extends Controller
{
    public function index(int $site): JsonResponse
    {
        $boards = Site::withTrashed()->findOrFail($site)
                      ->fuseBoards()
                      ->with('fuses')
                      ->orderBy('id')
                      ->get();

        return response()->success(data: FuseBoardResource::collection($boards));
    }

    public function store(FuseBoardRequest $request, Site $site): JsonResponse
    {
        $board = SaveFuseBoardAction::make()->handle(new FuseBoard(['site_id' => $site->id]), $request->validated());

        return response()->success(message: __('fuse_board_created'), data: new FuseBoardResource($board));
    }

    public function update(FuseBoardRequest $request, FuseBoard $fuseBoard): JsonResponse
    {
        $board = SaveFuseBoardAction::make()->handle($fuseBoard, $request->validated());

        return response()->success(message: __('fuse_board_saved'), data: new FuseBoardResource($board));
    }

    public function destroy(FuseBoard $fuseBoard): JsonResponse
    {
        DB::transaction(function () use ($fuseBoard) {
            Fuse::query()->where('fuse_board_id', $fuseBoard->id)->delete();
            $fuseBoard->delete();
        });

        return response()->success(message: __('fuse_board_deleted'));
    }
}

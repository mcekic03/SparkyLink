<?php

namespace App\Http\Controllers;

use App\Enums\ActivityLog\LogSubjectType;
use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use Illuminate\Http\JsonResponse;

class ActivityLogController extends Controller
{
    public function index(): JsonResponse
    {
        $activityLogs = ActivityLog::query()
                                   ->select([
                                       'id', 'causer_id', 'causer_type',
                                       'subject_id', 'subject_type', 'event',
                                       'loggable_name', 'created_at',
                                   ])
                                   ->with(['causer:id,name', 'subject'])
                                   ->searchWhereHas('causer', 'name')
                                   ->forSubjectType(
                                       request()->enum('subject_type', LogSubjectType::class)
                                   )
                                   ->filterFromRequest('event')
                                   ->filterFromRequest('causer_id')
                                   ->orderByDesc('id')
                                   ->paginate(request('per_page', 10));

        return response()->json([
            'pagination' => generate_pagination_data($activityLogs),
            'data' => ActivityLogResource::collection($activityLogs),
        ]);
    }

    public function show(ActivityLog $activityLog): JsonResponse
    {
        $activityLog->load(['causer:id,name', 'subject']);

        return response()->json([
            'data' => new ActivityLogResource($activityLog),
        ]);
    }
}

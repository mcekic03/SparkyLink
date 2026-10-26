<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Actions\Dashboard\Admin\BuildDashboardAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\Admin\DashboardRequest;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(DashboardRequest $request): JsonResponse
    {
        return response()->success(data: BuildDashboardAction::make()->handle(
            $request->validated('from'),
            $request->validated('to')
        ));
    }
}

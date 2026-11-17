<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function index(Request $request): Response
    {
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');

        $metrics = $this->dashboardService->getMetrics($startDate, $endDate);

        return Inertia::render('Dashboard', [
            'metrics' => $metrics,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(
        protected ReportService $reportService
    ) {}

    public function index(Request $request): Response
    {
        $type = $request->query('type', 'daily'); // daily, weekly, monthly
        $today = Carbon::now('Asia/Jakarta');

        $reportData = match ($type) {
            'weekly' => $this->reportService->getWeeklyReport(
                $request->query('start_date', $today->copy()->startOfWeek()->toDateString()),
                $request->query('end_date', $today->copy()->endOfWeek()->toDateString())
            ),
            'monthly' => $this->reportService->getMonthlyReport(
                (int) $request->query('year', $today->year),
                (int) $request->query('month', $today->month)
            ),
            default => $this->reportService->getDailyReport(
                $request->query('date', $today->toDateString())
            ),
        };

        return Inertia::render('Reports/Index', [
            'report' => $reportData,
            'filters' => [
                'type' => $type,
                'date' => $request->query('date', $today->toDateString()),
                'start_date' => $request->query('start_date', $today->copy()->startOfWeek()->toDateString()),
                'end_date' => $request->query('end_date', $today->copy()->endOfWeek()->toDateString()),
                'year' => (int) $request->query('year', $today->year),
                'month' => (int) $request->query('month', $today->month),
            ],
        ]);
    }

    public function export(Request $request): HttpResponse
    {
        $type = $request->query('type', 'daily');
        $today = Carbon::now('Asia/Jakarta');

        $reportData = match ($type) {
            'weekly' => $this->reportService->getWeeklyReport(
                $request->query('start_date', $today->copy()->startOfWeek()->toDateString()),
                $request->query('end_date', $today->copy()->endOfWeek()->toDateString())
            ),
            'monthly' => $this->reportService->getMonthlyReport(
                (int) $request->query('year', $today->year),
                (int) $request->query('month', $today->month)
            ),
            default => $this->reportService->getDailyReport(
                $request->query('date', $today->toDateString())
            ),
        };

        return $this->reportService->exportPdf($reportData);
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use App\Services\ExecutiveAccessService;
use Carbon\Carbon;
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

        $today = Carbon::today('Asia/Jakarta');
        $dailyToken = ExecutiveAccessService::generateDailyToken($today);
        $dailyUrl = url('/board/' . $dailyToken);
        $dateFormatted = $today->locale('id')->isoFormat('dddd, D MMMM Y');

        return Inertia::render('Dashboard', [
            'metrics' => $metrics,
            'executiveBoard' => [
                'token' => $dailyToken,
                'url' => $dailyUrl,
                'date_formatted' => $dateFormatted,
                'whatsapp_message' => "Halo Pak/Bu, berikut link pemantauan DevOps Executive Board untuk hari ini ({$dateFormatted}): {$dailyUrl}\n\n(Catatan: Link berlaku khusus 1 hari demi menjaga keamanan data operasional).",
            ],
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Models\Category;
use App\Models\Task;
use App\Services\DashboardService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExecutiveBoardController extends Controller
{
    public function __construct(
        protected DashboardService $dashboardService
    ) {}

    public function index(Request $request): Response
    {
        $metrics = $this->dashboardService->getMetrics();

        $updateQuery = function ($q) {
            $q->with('evidences.uploader')->orderBy('activity_date', 'desc')->orderBy('created_at', 'desc');
        };

        // Tasks currently In Progress (Sedang Dikerjakan)
        $inProgressTasks = Task::with(['category', 'creator', 'assets', 'evidences.uploader', 'updates' => $updateQuery])
            ->where('status', TaskStatus::InProgress->value)
            ->orderByRaw("CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END")
            ->orderBy('updated_at', 'desc')
            ->get();

        // Tasks Blocked (Mengalami Kendala Teknis / Menunggu Tindakan)
        $blockedTasks = Task::with(['category', 'creator', 'assets', 'evidences.uploader', 'updates' => $updateQuery])
            ->where('status', TaskStatus::Blocked->value)
            ->orderBy('updated_at', 'desc')
            ->get();

        // Recently Completed tasks (Pekerjaan yang Baru Selesai)
        $recentlyCompleted = Task::with(['category', 'creator', 'evidences.uploader', 'updates' => $updateQuery])
            ->where('status', TaskStatus::Completed->value)
            ->orderBy('completed_at', 'desc')
            ->limit(6)
            ->get();

        // All filterable tasks for the main interactive table
        $query = Task::with(['category', 'creator', 'assets', 'evidences.uploader', 'updates' => $updateQuery]);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('task_code', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $tasks = $query->orderBy('updated_at', 'desc')->paginate(12)->withQueryString();

        $categories = Category::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Executive/Board', [
            'metrics' => $metrics,
            'inProgressTasks' => $inProgressTasks,
            'blockedTasks' => $blockedTasks,
            'recentlyCompleted' => $recentlyCompleted,
            'tasks' => $tasks,
            'categories' => $categories,
            'filters' => [
                'status' => $request->input('status', ''),
                'category_id' => $request->input('category_id', ''),
                'search' => $request->input('search', ''),
            ],
            'currentTime' => Carbon::now('Asia/Jakarta')->format('d M Y, H:i') . ' WIB',
        ]);
    }
}

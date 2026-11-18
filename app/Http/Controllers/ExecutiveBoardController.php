<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Models\Category;
use App\Models\Task;
use App\Models\TaskUpdate;
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

        $today = Carbon::today('Asia/Jakarta');
        $todayString = $today->toDateString();
        $startOfWeek = $today->copy()->startOfWeek()->toDateString();
        $endOfWeek = $today->copy()->endOfWeek()->toDateString();
        $startOfMonth = $today->copy()->startOfMonth()->toDateString();
        $endOfMonth = $today->copy()->endOfMonth()->toDateString();

        $period = $request->input('period', 'all'); // 'all', 'today', 'this_week', 'this_month'
        $sortBy = $request->input('sort_by', 'latest_activity'); // 'latest_activity', 'due_date', 'priority', 'created_at'

        $todayPulse = [
            'date_formatted' => $today->locale('id')->isoFormat('dddd, D MMMM Y'),
            'activities_count' => TaskUpdate::where('activity_date', $todayString)->count(),
            'completed_count' => Task::where('status', TaskStatus::Completed->value)
                ->whereDate('completed_at', $todayString)
                ->count(),
            'blocked_count' => Task::where('status', TaskStatus::Blocked->value)->count(),
        ];

        $updateQuery = function ($q) {
            $q->with('evidences.uploader')->orderBy('activity_date', 'desc')->orderBy('created_at', 'desc');
        };

        // Query helper to apply period filter
        $applyPeriodFilter = function ($query) use ($period, $todayString, $startOfWeek, $endOfWeek, $startOfMonth, $endOfMonth) {
            if ($period === 'today') {
                $query->where(function ($q) use ($todayString) {
                    $q->whereHas('updates', fn($uq) => $uq->where('activity_date', $todayString))
                      ->orWhereDate('completed_at', $todayString);
                });
            } elseif ($period === 'this_week') {
                $query->where(function ($q) use ($startOfWeek, $endOfWeek) {
                    $q->whereHas('updates', fn($uq) => $uq->whereBetween('activity_date', [$startOfWeek, $endOfWeek]))
                      ->orWhereBetween('completed_at', [
                          Carbon::parse($startOfWeek)->startOfDay(),
                          Carbon::parse($endOfWeek)->endOfDay()
                      ]);
                });
            } elseif ($period === 'this_month') {
                $query->where(function ($q) use ($startOfMonth, $endOfMonth) {
                    $q->whereHas('updates', fn($uq) => $uq->whereBetween('activity_date', [$startOfMonth, $endOfMonth]))
                      ->orWhereBetween('completed_at', [
                          Carbon::parse($startOfMonth)->startOfDay(),
                          Carbon::parse($endOfMonth)->endOfDay()
                      ]);
                });
            }
        };

        // Query helper to apply sorting
        $applySorting = function ($query) use ($sortBy) {
            switch ($sortBy) {
                case 'due_date':
                    $query->orderByRaw("CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC");
                    break;
                case 'priority':
                    $query->orderByRaw("CASE priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END")
                          ->orderBy('updated_at', 'desc');
                    break;
                case 'created_at':
                    $query->orderBy('created_at', 'desc');
                    break;
                case 'latest_activity':
                default:
                    $query->select('tasks.*')
                          ->selectSub(
                              TaskUpdate::selectRaw('COALESCE(MAX(activity_date), tasks.created_at)')
                                  ->whereColumn('task_updates.task_id', 'tasks.id'),
                              'last_activity'
                          )
                          ->orderByDesc('last_activity')
                          ->orderByDesc('tasks.updated_at');
                    break;
            }
        };

        // 1. In Progress Tasks
        $inProgressQuery = Task::with(['category', 'creator', 'assets', 'evidences.uploader', 'updates' => $updateQuery])
            ->where('status', TaskStatus::InProgress->value);
        $applyPeriodFilter($inProgressQuery);
        $applySorting($inProgressQuery);
        $inProgressTasks = $inProgressQuery->get();

        // 2. Blocked Tasks
        $blockedQuery = Task::with(['category', 'creator', 'assets', 'evidences.uploader', 'updates' => $updateQuery])
            ->where('status', TaskStatus::Blocked->value);
        $applyPeriodFilter($blockedQuery);
        $applySorting($blockedQuery);
        $blockedTasks = $blockedQuery->get();

        // 3. Recently Completed Tasks
        $completedQuery = Task::with(['category', 'creator', 'evidences.uploader', 'updates' => $updateQuery])
            ->where('status', TaskStatus::Completed->value);
        $applyPeriodFilter($completedQuery);
        $completedQuery->orderBy('completed_at', 'desc');
        $recentlyCompleted = $completedQuery->limit(8)->get();

        // 4. Main filterable tasks table
        $tableQuery = Task::with(['category', 'creator', 'assets', 'evidences.uploader', 'updates' => $updateQuery]);
        $applyPeriodFilter($tableQuery);

        if ($request->filled('status')) {
            $tableQuery->where('status', $request->input('status'));
        }

        if ($request->filled('category_id')) {
            $tableQuery->where('category_id', $request->input('category_id'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $tableQuery->where(function ($q) use ($search) {
                $q->where('task_code', 'like', "%{$search}%")
                  ->orWhere('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $applySorting($tableQuery);
        $tasks = $tableQuery->paginate(12)->withQueryString();

        $categories = Category::where('is_active', true)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Executive/Board', [
            'metrics' => $metrics,
            'todayPulse' => $todayPulse,
            'inProgressTasks' => $inProgressTasks,
            'blockedTasks' => $blockedTasks,
            'recentlyCompleted' => $recentlyCompleted,
            'tasks' => $tasks,
            'categories' => $categories,
            'filters' => [
                'period' => $period,
                'sort_by' => $sortBy,
                'status' => $request->input('status', ''),
                'category_id' => $request->input('category_id', ''),
                'search' => $request->input('search', ''),
            ],
            'currentTime' => Carbon::now('Asia/Jakarta')->format('d M Y, H:i') . ' WIB',
        ]);
    }
}

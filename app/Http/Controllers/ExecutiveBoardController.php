<?php

namespace App\Http\Controllers;

use App\Enums\TaskStatus;
use App\Models\Category;
use App\Models\Task;
use App\Models\TaskUpdate;
use App\Services\DashboardService;
use App\Services\ExecutiveAccessService;
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
        $today = Carbon::today('Asia/Jakarta');
        $token = $request->route('token') ?? $request->query('token');

        // Validate daily unique token or authenticated session
        $validation = ExecutiveAccessService::validateToken($token, auth()->check());

        // If access is not valid (e.g. expired, missing, or invalid), return guarded state with no data leakage
        if ($validation['status'] !== 'valid') {
            return Inertia::render('Executive/Board', [
                'access' => [
                    'status' => $validation['status'],
                    'message' => $validation['message'],
                    'expired_date' => $validation['expired_date'] ?? null,
                    'is_authenticated' => false,
                    'daily_token' => $token,
                    'daily_url' => null,
                    'whatsapp_message' => null,
                ],
                'metrics' => [
                    'summary' => [
                        'total_tasks' => 0,
                        'completed' => 0,
                        'in_progress' => 0,
                        'blocked' => 0,
                        'backlog' => 0,
                        'cancelled' => 0,
                        'overdue' => 0,
                        'active_assets' => 0,
                        'maintenance_assets' => 0,
                    ],
                    'categories' => [],
                    'priorities' => ['critical' => 0, 'high' => 0, 'medium' => 0, 'low' => 0],
                    'recent_activities' => [],
                    'due_soon_tasks' => [],
                    'filters' => [],
                ],
                'todayPulse' => [
                    'date_formatted' => $today->locale('id')->isoFormat('dddd, D MMMM Y'),
                    'activities_count' => 0,
                    'completed_count' => 0,
                    'blocked_count' => 0,
                ],
                'inProgressTasks' => [],
                'blockedTasks' => [],
                'recentlyCompleted' => [],
                'tasks' => [
                    'data' => [],
                    'links' => [],
                    'total' => 0,
                ],
                'categories' => [],
                'filters' => [
                    'token' => $token ?? '',
                    'period' => 'all',
                    'sort_by' => 'latest_activity',
                    'status' => '',
                    'category_id' => '',
                    'search' => '',
                ],
                'currentTime' => Carbon::now('Asia/Jakarta')->format('d M Y, H:i') . ' WIB',
            ]);
        }

        $metrics = $this->dashboardService->getMetrics();

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
                    $query->orderByRaw("CASE 
                        WHEN priority = 'critical' THEN 1 
                        WHEN priority = 'high' THEN 2 
                        WHEN priority = 'medium' THEN 3 
                        WHEN priority = 'low' THEN 4 
                        ELSE 5 END");
                    break;
                case 'created_at':
                    $query->orderBy('created_at', 'desc');
                    break;
                case 'latest_activity':
                default:
                    // Sort by the latest task update activity_date, fallback to task created_at
                    $latestActivitySubquery = TaskUpdate::selectRaw('COALESCE(MAX(activity_date), tasks.created_at)')
                        ->whereColumn('task_updates.task_id', 'tasks.id');
                    $query->orderByDesc($latestActivitySubquery)->orderBy('tasks.created_at', 'desc');
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

        $activeDailyToken = $validation['daily_token'] ?? ExecutiveAccessService::generateDailyToken($today);
        $dailyUrl = url('/board/' . $activeDailyToken);
        $formattedDate = $today->locale('id')->isoFormat('dddd, D MMMM Y');
        $whatsappMessage = "Halo Pak/Bu, berikut link pemantauan DevOps Executive Board untuk hari ini ({$formattedDate}): {$dailyUrl}\n\n(Catatan: Link berlaku khusus 1 hari demi menjaga keamanan data operasional).";

        return Inertia::render('Executive/Board', [
            'access' => [
                'status' => 'valid',
                'message' => $validation['message'] ?? 'Akses aktif.',
                'expired_date' => null,
                'is_authenticated' => auth()->check(),
                'daily_token' => $activeDailyToken,
                'daily_url' => $dailyUrl,
                'whatsapp_message' => $whatsappMessage,
            ],
            'metrics' => $metrics,
            'todayPulse' => $todayPulse,
            'inProgressTasks' => $inProgressTasks,
            'blockedTasks' => $blockedTasks,
            'recentlyCompleted' => $recentlyCompleted,
            'tasks' => $tasks,
            'categories' => $categories,
            'filters' => [
                'token' => $token ?? '',
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

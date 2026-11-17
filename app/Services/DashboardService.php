<?php

namespace App\Services;

use App\Enums\AssetStatus;
use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Models\Category;
use App\Models\InfrastructureAsset;
use App\Models\Task;
use App\Models\TaskUpdate;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Get aggregate dashboard statistics and summaries.
     */
    public function getMetrics(?string $startDate = null, ?string $endDate = null): array
    {
        $today = Carbon::now('Asia/Jakarta')->toDateString();

        // Base query for tasks
        $taskQuery = Task::query();

        if ($startDate && $endDate) {
            $taskQuery->whereBetween('start_date', [$startDate, $endDate]);
        } elseif ($startDate) {
            $taskQuery->where('start_date', '>=', $startDate);
        } elseif ($endDate) {
            $taskQuery->where('start_date', '<=', $endDate);
        }

        $totalTasks = (clone $taskQuery)->count();
        $completedTasks = (clone $taskQuery)->where('status', TaskStatus::Completed->value)->count();
        $inProgressTasks = (clone $taskQuery)->where('status', TaskStatus::InProgress->value)->count();
        $blockedTasks = (clone $taskQuery)->where('status', TaskStatus::Blocked->value)->count();
        $backlogTasks = (clone $taskQuery)->where('status', TaskStatus::Backlog->value)->count();
        $cancelledTasks = (clone $taskQuery)->where('status', TaskStatus::Cancelled->value)->count();

        // Overdue tasks
        $overdueTasksCount = Task::whereNotNull('due_date')
            ->where('due_date', '<', $today)
            ->whereNotIn('status', [TaskStatus::Completed->value, TaskStatus::Cancelled->value])
            ->count();

        // Tasks due soon (within 7 days)
        $dueSoonTasks = Task::with(['category', 'creator'])
            ->whereNotNull('due_date')
            ->whereBetween('due_date', [$today, Carbon::now('Asia/Jakarta')->addDays(7)->toDateString()])
            ->whereNotIn('status', [TaskStatus::Completed->value, TaskStatus::Cancelled->value])
            ->orderBy('due_date', 'asc')
            ->limit(5)
            ->get();

        // Category breakdown
        $categoriesWithCounts = Category::where('is_active', true)
            ->withCount('tasks')
            ->orderBy('tasks_count', 'desc')
            ->get(['id', 'name', 'slug', 'tasks_count']);

        // Priority breakdown
        $priorityCounts = [
            'critical' => (clone $taskQuery)->where('priority', TaskPriority::Critical->value)->count(),
            'high' => (clone $taskQuery)->where('priority', TaskPriority::High->value)->count(),
            'medium' => (clone $taskQuery)->where('priority', TaskPriority::Medium->value)->count(),
            'low' => (clone $taskQuery)->where('priority', TaskPriority::Low->value)->count(),
        ];

        // Recent activity updates (last 8)
        $recentActivities = TaskUpdate::with(['task.category', 'user'])
            ->orderBy('activity_date', 'desc')
            ->orderBy('created_at', 'desc')
            ->limit(8)
            ->get();

        // Infrastructure count
        $activeAssetsCount = InfrastructureAsset::where('status', AssetStatus::Active->value)->count();
        $maintenanceAssetsCount = InfrastructureAsset::where('status', AssetStatus::Maintenance->value)->count();

        return [
            'summary' => [
                'total_tasks' => $totalTasks,
                'completed' => $completedTasks,
                'in_progress' => $inProgressTasks,
                'blocked' => $blockedTasks,
                'backlog' => $backlogTasks,
                'cancelled' => $cancelledTasks,
                'overdue' => $overdueTasksCount,
                'active_assets' => $activeAssetsCount,
                'maintenance_assets' => $maintenanceAssetsCount,
            ],
            'categories' => $categoriesWithCounts,
            'priorities' => $priorityCounts,
            'recent_activities' => $recentActivities,
            'due_soon_tasks' => $dueSoonTasks,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
        ];
    }
}

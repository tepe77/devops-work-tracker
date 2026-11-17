<?php

namespace App\Services;

use App\Enums\TaskStatus;
use App\Models\Category;
use App\Models\Task;
use App\Models\TaskUpdate;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Response;

class ReportService
{
    /**
     * Generate daily report data.
     */
    public function getDailyReport(string $date): array
    {
        $activities = TaskUpdate::with(['task.category', 'task.assets', 'user', 'evidences'])
            ->where('activity_date', $date)
            ->orderBy('created_at', 'asc')
            ->get();

        $taskIds = $activities->pluck('task_id')->unique();
        $tasksInvolved = Task::with(['category', 'assets'])->whereIn('id', $taskIds)->get();

        return [
            'type' => 'daily',
            'date' => $date,
            'formatted_date' => Carbon::parse($date)->locale('id')->isoFormat('dddd, D MMMM Y'),
            'total_activities' => $activities->count(),
            'total_tasks_affected' => $taskIds->count(),
            'activities' => $activities,
            'tasks' => $tasksInvolved,
        ];
    }

    /**
     * Generate weekly report data (Monday - Sunday).
     */
    public function getWeeklyReport(string $startDate, string $endDate): array
    {
        $activities = TaskUpdate::with(['task.category', 'task.assets', 'user', 'evidences'])
            ->whereBetween('activity_date', [$startDate, $endDate])
            ->orderBy('activity_date', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        $completedTasks = Task::with(['category', 'assets'])
            ->whereBetween('completed_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay(),
            ])
            ->get();

        $inProgressTasks = Task::with(['category', 'assets'])
            ->where('status', TaskStatus::InProgress->value)
            ->get();

        $blockedTasks = Task::with(['category', 'assets'])
            ->where('status', TaskStatus::Blocked->value)
            ->get();

        return [
            'type' => 'weekly',
            'start_date' => $startDate,
            'end_date' => $endDate,
            'formatted_period' => Carbon::parse($startDate)->locale('id')->isoFormat('D MMMM Y') . ' s/d ' . Carbon::parse($endDate)->locale('id')->isoFormat('D MMMM Y'),
            'total_activities' => $activities->count(),
            'completed_count' => $completedTasks->count(),
            'in_progress_count' => $inProgressTasks->count(),
            'blocked_count' => $blockedTasks->count(),
            'activities' => $activities,
            'completed_tasks' => $completedTasks,
            'in_progress_tasks' => $inProgressTasks,
            'blocked_tasks' => $blockedTasks,
        ];
    }

    /**
     * Generate monthly report data.
     */
    public function getMonthlyReport(int $year, int $month): array
    {
        $startOfMonth = Carbon::createFromDate($year, $month, 1, 'Asia/Jakarta')->startOfMonth()->toDateString();
        $endOfMonth = Carbon::createFromDate($year, $month, 1, 'Asia/Jakarta')->endOfMonth()->toDateString();

        $activities = TaskUpdate::with(['task.category', 'user'])
            ->whereBetween('activity_date', [$startOfMonth, $endOfMonth])
            ->get();

        // Tasks completed in this month
        $completedTasks = Task::with(['category', 'assets'])
            ->whereBetween('completed_at', [
                Carbon::parse($startOfMonth)->startOfDay(),
                Carbon::parse($endOfMonth)->endOfDay(),
            ])
            ->get();

        // Tasks still active
        $activeTasks = Task::with(['category', 'assets'])
            ->whereIn('status', [TaskStatus::InProgress->value, TaskStatus::Blocked->value, TaskStatus::Backlog->value])
            ->get();

        // Group activities by category
        $categoriesSummary = Category::withCount(['tasks' => function ($query) use ($startOfMonth, $endOfMonth) {
            $query->whereBetween('start_date', [$startOfMonth, $endOfMonth]);
        }])->get();

        return [
            'type' => 'monthly',
            'year' => $year,
            'month' => $month,
            'formatted_month' => Carbon::createFromDate($year, $month, 1)->locale('id')->isoFormat('MMMM Y'),
            'start_date' => $startOfMonth,
            'end_date' => $endOfMonth,
            'total_activities' => $activities->count(),
            'completed_count' => $completedTasks->count(),
            'active_count' => $activeTasks->count(),
            'activities' => $activities,
            'completed_tasks' => $completedTasks,
            'active_tasks' => $activeTasks,
            'categories' => $categoriesSummary,
        ];
    }

    /**
     * Export report data as downloadable PDF.
     */
    public function exportPdf(array $reportData): Response
    {
        $pdf = Pdf::loadView('reports.pdf', ['report' => $reportData]);
        $pdf->setPaper('a4', 'portrait');

        $filename = sprintf('DevOps_Report_%s_%s.pdf', $reportData['type'], now('Asia/Jakarta')->format('Ymd_His'));

        return $pdf->download($filename);
    }
}

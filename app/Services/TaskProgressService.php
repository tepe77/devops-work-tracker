<?php

namespace App\Services;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\TaskUpdate;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TaskProgressService
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    /**
     * Record a new daily activity update and atomically transition task state.
     */
    public function recordActivity(Task $task, User $user, array $data): TaskUpdate
    {
        $status = $data['status'] instanceof TaskStatus 
            ? $data['status'] 
            : TaskStatus::from($data['status']);

        $progress = (int) $data['progress_percent'];

        // Enforce domain progress rules
        $this->validateProgressForStatus($status, $progress);

        return DB::transaction(function () use ($task, $user, $data, $status, $progress) {
            $oldTaskState = [
                'status' => $task->status->value,
                'progress_percent' => $task->progress_percent,
                'completed_at' => $task->completed_at?->toIso8601String(),
            ];

            // 1. Create immutable update record
            $update = TaskUpdate::create([
                'task_id' => $task->id,
                'user_id' => $user->id,
                'activity_date' => $data['activity_date'],
                'summary' => $data['summary'],
                'work_done' => $data['work_done'],
                'result' => $data['result'] ?? null,
                'blocker' => $data['blocker'] ?? null,
                'next_action' => $data['next_action'] ?? null,
                'progress_percent' => $progress,
                'status' => $status,
            ]);

            // 2. Determine completed_at transition
            $completedAt = $task->completed_at;
            if ($status === TaskStatus::Completed && !$task->completed_at) {
                $activityDate = Carbon::parse($data['activity_date'], 'Asia/Jakarta');
                $completedAt = $activityDate->isPast() && !$activityDate->isToday()
                    ? $activityDate->endOfDay()
                    : now();
            } elseif ($status !== TaskStatus::Completed && $task->completed_at) {
                // Task is reopened
                $completedAt = null;
            }

            // 3. Update task state if this update is the latest or equal chronologically
            $latestExistingUpdate = $task->updates()
                ->where('id', '!=', $update->id)
                ->orderBy('activity_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->first();

            $isLatestUpdate = !$latestExistingUpdate || $data['activity_date'] >= $latestExistingUpdate->activity_date->toDateString();

            if ($isLatestUpdate) {
                $task->update([
                    'status' => $status,
                    'progress_percent' => $progress,
                    'completed_at' => $completedAt,
                ]);
            }

            $newTaskState = [
                'status' => $task->status->value,
                'progress_percent' => $task->progress_percent,
                'completed_at' => $task->completed_at?->toIso8601String(),
            ];

            // 4. Record audit log for task status/progress change
            $this->auditLogService->log(
                event: 'task_update_created',
                model: $update,
                newValues: [
                    'task_code' => $task->task_code,
                    'activity_date' => $update->activity_date->toDateString(),
                    'summary' => $update->summary,
                    'status' => $status->value,
                    'progress_percent' => $progress,
                ],
                userId: $user->id
            );

            if ($oldTaskState['status'] !== $newTaskState['status'] || 
                $oldTaskState['progress_percent'] !== $newTaskState['progress_percent']) {
                $this->auditLogService->log(
                    event: 'task_progress_changed',
                    model: $task,
                    oldValues: $oldTaskState,
                    newValues: $newTaskState,
                    metadata: ['via_activity_id' => $update->id],
                    userId: $user->id
                );
            }

            return $update;
        });
    }

    /**
     * Validate consistency between status and progress percent.
     */
    public function validateProgressForStatus(TaskStatus $status, int $progress): void
    {
        if ($progress < 0 || $progress > 100) {
            throw ValidationException::withMessages([
                'progress_percent' => 'Nilai progress harus berada di antara 0% dan 100%.',
            ]);
        }

        switch ($status) {
            case TaskStatus::Backlog:
                if ($progress !== 0) {
                    throw ValidationException::withMessages([
                        'progress_percent' => 'Status Backlog harus memiliki progress 0%.',
                    ]);
                }
                break;
            case TaskStatus::InProgress:
            case TaskStatus::Blocked:
                if ($progress < 1 || $progress > 99) {
                    throw ValidationException::withMessages([
                        'progress_percent' => "Status {$status->label()} harus memiliki progress antara 1% sampai 99%.",
                    ]);
                }
                break;
            case TaskStatus::Completed:
                if ($progress !== 100) {
                    throw ValidationException::withMessages([
                        'progress_percent' => 'Status Completed harus memiliki progress 100%.',
                    ]);
                }
                break;
            case TaskStatus::Cancelled:
                // Cancelled preserves last progress
                break;
        }
    }
}

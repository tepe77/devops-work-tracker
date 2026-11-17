<?php

namespace App\Services;

use App\Enums\TaskStatus;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class TaskService
{
    public function __construct(
        protected TaskCodeGenerator $codeGenerator,
        protected TaskProgressService $progressService,
        protected AuditLogService $auditLogService
    ) {}

    /**
     * Create a new task.
     */
    public function createTask(User $creator, array $data): Task
    {
        $status = isset($data['status']) ? TaskStatus::from($data['status']) : TaskStatus::Backlog;
        $progress = isset($data['progress_percent']) ? (int) $data['progress_percent'] : 0;

        $this->progressService->validateProgressForStatus($status, $progress);

        return DB::transaction(function () use ($creator, $data, $status, $progress) {
            $code = $this->codeGenerator->generate();

            $completedAt = null;
            if ($status === TaskStatus::Completed) {
                $completedAt = now();
            }

            $task = Task::create([
                'task_code' => $code,
                'title' => $data['title'],
                'description' => $data['description'],
                'project_id' => $data['project_id'] ?? null,
                'category_id' => $data['category_id'],
                'created_by' => $creator->id,
                'priority' => $data['priority'],
                'status' => $status,
                'progress_percent' => $progress,
                'start_date' => $data['start_date'],
                'due_date' => $data['due_date'] ?? null,
                'completed_at' => $completedAt,
            ]);

            if (!empty($data['asset_ids'])) {
                $task->assets()->sync($data['asset_ids']);
            }

            $this->auditLogService->log(
                event: 'task_created',
                model: $task,
                newValues: [
                    'task_code' => $task->task_code,
                    'title' => $task->title,
                    'priority' => $task->priority->value,
                    'status' => $task->status->value,
                ],
                userId: $creator->id
            );

            return $task;
        });
    }

    /**
     * Update an existing task.
     */
    public function updateTask(Task $task, array $data, ?User $actor = null): Task
    {
        return DB::transaction(function () use ($task, $data, $actor) {
            $oldValues = $task->only([
                'title',
                'description',
                'project_id',
                'category_id',
                'priority',
                'start_date',
                'due_date',
            ]);

            $task->update([
                'title' => $data['title'] ?? $task->title,
                'description' => $data['description'] ?? $task->description,
                'project_id' => array_key_exists('project_id', $data) ? $data['project_id'] : $task->project_id,
                'category_id' => $data['category_id'] ?? $task->category_id,
                'priority' => $data['priority'] ?? $task->priority,
                'start_date' => $data['start_date'] ?? $task->start_date,
                'due_date' => array_key_exists('due_date', $data) ? $data['due_date'] : $task->due_date,
            ]);

            if (isset($data['asset_ids'])) {
                $task->assets()->sync($data['asset_ids']);
            }

            $this->auditLogService->log(
                event: 'task_updated',
                model: $task,
                oldValues: $oldValues,
                newValues: $task->only(array_keys($oldValues)),
                userId: $actor?->id
            );

            return $task;
        });
    }

    /**
     * Soft delete a task.
     */
    public function deleteTask(Task $task, ?User $actor = null): void
    {
        DB::transaction(function () use ($task, $actor) {
            $this->auditLogService->log(
                event: 'task_deleted',
                model: $task,
                oldValues: ['task_code' => $task->task_code, 'title' => $task->title],
                userId: $actor?->id
            );

            $task->delete();
        });
    }
}

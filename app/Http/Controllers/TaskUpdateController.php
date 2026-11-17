<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskUpdateRequest;
use App\Http\Requests\UpdateTaskUpdateRequest;
use App\Models\Task;
use App\Models\TaskUpdate;
use App\Services\EvidenceService;
use App\Services\TaskProgressService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class TaskUpdateController extends Controller
{
    public function __construct(
        protected TaskProgressService $progressService,
        protected EvidenceService $evidenceService
    ) {}

    public function store(StoreTaskUpdateRequest $request, Task $task): RedirectResponse
    {
        $this->authorize('update', $task);

        $update = $this->progressService->recordActivity($task, $request->user(), $request->validated());

        if ($request->hasFile('evidence_file')) {
            $this->evidenceService->upload(
                task: $task,
                file: $request->file('evidence_file'),
                uploader: $request->user(),
                taskUpdateId: $update->id,
                caption: $request->input('evidence_caption')
            );
        }

        return redirect()->route('tasks.show', $task)->with('success', 'Daily activity update berhasil dicatat.');
    }

    public function update(UpdateTaskUpdateRequest $request, Task $task, TaskUpdate $update): RedirectResponse
    {
        $this->authorize('update', $update);

        if ($update->task_id !== $task->id) {
            abort(404);
        }

        $this->progressService->updateActivity($update, $request->user(), $request->validated());

        if ($request->hasFile('evidence_file')) {
            $this->evidenceService->upload(
                task: $task,
                file: $request->file('evidence_file'),
                uploader: $request->user(),
                taskUpdateId: $update->id,
                caption: $request->input('evidence_caption')
            );
        }

        return redirect()->route('tasks.show', $task)->with('success', 'Catatan histori pengerjaan berhasil diperbarui.');
    }

    public function destroy(Request $request, Task $task, TaskUpdate $update): RedirectResponse
    {
        $this->authorize('delete', $update);

        if ($update->task_id !== $task->id) {
            abort(404);
        }

        $this->progressService->deleteActivity($update, $request->user());

        return redirect()->route('tasks.show', $task)->with('success', 'Catatan histori pengerjaan berhasil dihapus.');
    }
}

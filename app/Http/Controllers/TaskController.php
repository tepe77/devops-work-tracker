<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Category;
use App\Models\InfrastructureAsset;
use App\Models\Project;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TaskController extends Controller
{
    public function __construct(
        protected TaskService $taskService
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Task::class);

        $query = Task::with(['category', 'project', 'creator', 'assets']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('task_code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($priority = $request->query('priority')) {
            $query->where('priority', $priority);
        }

        if ($category = $request->query('category_id')) {
            $query->where('category_id', $category);
        }

        if ($assetId = $request->query('asset_id')) {
            $query->whereHas('assets', function ($q) use ($assetId) {
                $q->where('infrastructure_assets.id', $assetId);
            });
        }

        $tasks = $query->orderBy('created_at', 'desc')->paginate(12)->withQueryString();

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'categories' => Category::where('is_active', true)->get(['id', 'name']),
            'assets' => InfrastructureAsset::get(['id', 'name', 'asset_type', 'environment']),
            'filters' => $request->only(['search', 'status', 'priority', 'category_id', 'asset_id']),
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', Task::class);

        return Inertia::render('Tasks/Create', [
            'categories' => Category::where('is_active', true)->get(['id', 'name']),
            'projects' => Project::where('status', 'active')->get(['id', 'name']),
            'assets' => InfrastructureAsset::where('status', 'active')->get(['id', 'name', 'asset_type', 'environment']),
        ]);
    }

    public function store(StoreTaskRequest $request): RedirectResponse
    {
        $task = $this->taskService->createTask($request->user(), $request->validated());

        return redirect()->route('tasks.show', $task)->with('success', "Task {$task->task_code} berhasil dibuat.");
    }

    public function show(Task $task): Response
    {
        $this->authorize('view', $task);

        $task->load([
            'category',
            'project',
            'creator',
            'assets',
            'updates.user',
            'updates.evidences.uploader',
            'evidences.uploader',
        ]);

        return Inertia::render('Tasks/Show', [
            'task' => $task,
        ]);
    }

    public function edit(Task $task): Response
    {
        $this->authorize('update', $task);

        $task->load('assets');

        return Inertia::render('Tasks/Edit', [
            'task' => $task,
            'categories' => Category::where('is_active', true)->get(['id', 'name']),
            'projects' => Project::get(['id', 'name', 'status']),
            'assets' => InfrastructureAsset::get(['id', 'name', 'asset_type', 'environment', 'status']),
        ]);
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $this->taskService->updateTask($task, $request->validated(), $request->user());

        return redirect()->route('tasks.show', $task)->with('success', "Task {$task->task_code} berhasil diperbarui.");
    }

    public function destroy(Request $request, Task $task): RedirectResponse
    {
        $this->authorize('delete', $task);

        $this->taskService->deleteTask($task, $request->user());

        return redirect()->route('tasks.index')->with('success', "Task {$task->task_code} telah diarsipkan/dihapus.");
    }
}

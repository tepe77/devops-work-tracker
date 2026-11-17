<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Projects/Index', [
            'projects' => Project::withCount('tasks')->latest()->paginate(15),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,completed,archived',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);

        $project = Project::create($validated);

        $this->auditLogService->log(
            event: 'project_created',
            model: $project,
            newValues: $project->only(['name', 'status', 'start_date', 'due_date']),
            userId: $request->user()?->id
        );

        return back()->with('success', 'Project berhasil ditambahkan.');
    }

    public function update(Request $request, Project $project): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,completed,archived',
            'start_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:start_date',
        ]);

        $oldValues = $project->only(['name', 'description', 'status', 'start_date', 'due_date']);
        $project->update($validated);

        $this->auditLogService->log(
            event: 'project_updated',
            model: $project,
            oldValues: $oldValues,
            newValues: $project->only(array_keys($oldValues)),
            userId: $request->user()?->id
        );

        return back()->with('success', 'Project berhasil diperbarui.');
    }
}

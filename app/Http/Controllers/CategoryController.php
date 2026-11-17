<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    public function index(): Response
    {
        return Inertia::render('Categories/Index', [
            'categories' => Category::withCount('tasks')->orderBy('name', 'asc')->paginate(20),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $category = Category::create($validated);

        $this->auditLogService->log(
            event: 'category_created',
            model: $category,
            newValues: $category->only(['name', 'description', 'is_active']),
            userId: $request->user()?->id
        );

        return back()->with('success', 'Kategori pekerjaan berhasil ditambahkan.');
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:categories,name,' . $category->id,
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']);

        $oldValues = $category->only(['name', 'description', 'is_active']);
        $category->update($validated);

        $this->auditLogService->log(
            event: 'category_updated',
            model: $category,
            oldValues: $oldValues,
            newValues: $category->only(array_keys($oldValues)),
            userId: $request->user()?->id
        );

        return back()->with('success', 'Kategori pekerjaan berhasil diperbarui.');
    }
}

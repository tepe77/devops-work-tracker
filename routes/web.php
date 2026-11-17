<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EvidenceController;
use App\Http\Controllers\ExecutiveBoardController;
use App\Http\Controllers\InfrastructureAssetController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\TaskUpdateController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// Redirect root to dashboard or login
Route::get('/', function () {
    return redirect()->route('dashboard');
});

// Public Executive Board & Evidence Access (Khusus Atasan / Management tanpa perlu login)
Route::get('/board', [ExecutiveBoardController::class, 'index'])->name('executive.board');
Route::get('/executive', fn() => redirect()->route('executive.board'));
Route::get('/evidences/{evidence}/download', [EvidenceController::class, 'download'])->name('evidences.download');

// Authenticated routes (Accessible by both Admin and Viewer unless restricted)
Route::middleware(['auth', 'active'])->group(function () {
    // 1. Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 2. Tasks & Activity (Read-only routes for all authenticated roles)
    Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
    Route::get('/tasks/{task}', [TaskController::class, 'show'])->name('tasks.show')->whereNumber('task');

    // 3. Infrastructure Assets (Read-only)
    Route::get('/infrastructure', [InfrastructureAssetController::class, 'index'])->name('infrastructure.index');
    Route::get('/infrastructure/{infrastructure}', [InfrastructureAssetController::class, 'show'])->name('infrastructure.show')->whereNumber('infrastructure');

    // 4. Reports & PDF Export
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportController::class, 'export'])->name('reports.export');

    // 5. User Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // 7. Audit Logs (Viewer can read if authorized, or admin only)
    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');

    // Admin-Only Routes (Strictly enforced at route level + policy check)
    Route::middleware('admin')->group(function () {
        // Task Write Operations
        Route::get('/tasks/create', [TaskController::class, 'create'])->name('tasks.create');
        Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
        Route::get('/tasks/{task}/edit', [TaskController::class, 'edit'])->name('tasks.edit')->whereNumber('task');
        Route::put('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update')->whereNumber('task');
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy')->whereNumber('task');

        // Task Daily Activity Update
        Route::post('/tasks/{task}/updates', [TaskUpdateController::class, 'store'])->name('tasks.updates.store')->whereNumber('task');

        // Infrastructure Assets Write Operations
        Route::get('/infrastructure/create', [InfrastructureAssetController::class, 'create'])->name('infrastructure.create');
        Route::get('/infrastructure/template', [InfrastructureAssetController::class, 'template'])->name('infrastructure.template');
        Route::post('/infrastructure/import', [InfrastructureAssetController::class, 'import'])->name('infrastructure.import');
        Route::post('/infrastructure', [InfrastructureAssetController::class, 'store'])->name('infrastructure.store');
        Route::get('/infrastructure/{infrastructure}/edit', [InfrastructureAssetController::class, 'edit'])->name('infrastructure.edit')->whereNumber('infrastructure');
        Route::put('/infrastructure/{infrastructure}', [InfrastructureAssetController::class, 'update'])->name('infrastructure.update')->whereNumber('infrastructure');
        Route::delete('/infrastructure/{infrastructure}', [InfrastructureAssetController::class, 'destroy'])->name('infrastructure.destroy')->whereNumber('infrastructure');

        // Evidences Write Operations
        Route::post('/evidences', [EvidenceController::class, 'store'])->name('evidences.store');
        Route::delete('/evidences/{evidence}', [EvidenceController::class, 'destroy'])->name('evidences.destroy');

        // User Management (Admin only)
        Route::resource('users', UserController::class)->except(['show']);

        // Project & Category Management
        Route::resource('projects', ProjectController::class)->only(['index', 'store', 'update']);
        Route::resource('categories', CategoryController::class)->only(['index', 'store', 'update']);
    });
});

require __DIR__.'/auth.php';

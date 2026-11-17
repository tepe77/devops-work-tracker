<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\InfrastructureAsset;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $viewer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name' => 'DevOps Admin',
            'email' => 'admin@test.internal',
            'role' => UserRole::Admin,
            'is_active' => true,
        ]);

        $this->viewer = User::factory()->create([
            'name' => 'Management Viewer',
            'email' => 'viewer@test.internal',
            'role' => UserRole::Viewer,
            'is_active' => true,
        ]);
    }

    public function test_authenticated_user_can_view_audit_logs_page(): void
    {
        AuditLog::create([
            'user_id' => $this->admin->id,
            'event' => 'task_created',
            'auditable_type' => 'App\Models\Task',
            'auditable_id' => 1,
            'new_values' => ['title' => 'Test Task'],
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->get('/audit-logs');
        $response->assertStatus(200);

        $responseViewer = $this->actingAs($this->viewer)->get('/audit-logs');
        $responseViewer->assertStatus(200);
    }

    public function test_guest_is_redirected_to_login_from_audit_logs(): void
    {
        $response = $this->get('/audit-logs');
        $response->assertRedirect('/login');
    }

    public function test_audit_logs_can_be_filtered_by_event(): void
    {
        AuditLog::create([
            'user_id' => $this->admin->id,
            'event' => 'task_created',
            'auditable_type' => 'App\Models\Task',
            'auditable_id' => 1,
            'new_values' => ['title' => 'Task A'],
            'created_at' => now(),
        ]);

        AuditLog::create([
            'user_id' => $this->admin->id,
            'event' => 'asset_created',
            'auditable_type' => 'App\Models\InfrastructureAsset',
            'auditable_id' => 2,
            'new_values' => ['name' => 'Server B'],
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->get('/audit-logs?event=task_created');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('AuditLogs/Index')
                ->has('logs.data', 1)
                ->where('logs.data.0.event', 'task_created')
        );
    }

    public function test_audit_logs_can_be_searched_by_keyword(): void
    {
        AuditLog::create([
            'user_id' => $this->admin->id,
            'event' => 'project_created',
            'auditable_type' => 'App\Models\Project',
            'auditable_id' => 99,
            'new_values' => ['name' => 'SuperSecretMigrasi2026'],
            'created_at' => now(),
        ]);

        $response = $this->actingAs($this->admin)->get('/audit-logs?search=SuperSecretMigrasi2026');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => 
            $page->component('AuditLogs/Index')
                ->has('logs.data', 1)
                ->where('logs.data.0.auditable_id', 99)
        );
    }

    public function test_project_store_and_update_records_audit_log(): void
    {
        $response = $this->actingAs($this->admin)->post('/projects', [
            'name' => 'Automated Backup Migration',
            'description' => 'Backup migration pipeline',
            'status' => 'active',
            'start_date' => now()->toDateString(),
            'due_date' => now()->addMonth()->toDateString(),
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('projects', ['name' => 'Automated Backup Migration']);

        $project = Project::where('name', 'Automated Backup Migration')->firstOrFail();
        $this->assertDatabaseHas('audit_logs', [
            'event' => 'project_created',
            'auditable_type' => Project::class,
            'auditable_id' => $project->id,
            'user_id' => $this->admin->id,
        ]);

        // Test update
        $updateResponse = $this->actingAs($this->admin)->put("/projects/{$project->id}", [
            'name' => 'Automated Backup Migration Phase 2',
            'description' => 'Updated pipeline',
            'status' => 'completed',
            'start_date' => now()->toDateString(),
            'due_date' => now()->addMonth()->toDateString(),
        ]);

        $updateResponse->assertRedirect();
        $this->assertDatabaseHas('audit_logs', [
            'event' => 'project_updated',
            'auditable_type' => Project::class,
            'auditable_id' => $project->id,
            'user_id' => $this->admin->id,
        ]);
    }

    public function test_category_store_and_update_records_audit_log(): void
    {
        $response = $this->actingAs($this->admin)->post('/categories', [
            'name' => 'Container Orchestration',
            'description' => 'Docker & Kubernetes operations',
            'is_active' => true,
        ]);

        $response->assertRedirect();
        $category = Category::where('name', 'Container Orchestration')->firstOrFail();

        $this->assertDatabaseHas('audit_logs', [
            'event' => 'category_created',
            'auditable_type' => Category::class,
            'auditable_id' => $category->id,
            'user_id' => $this->admin->id,
        ]);

        // Test update
        $updateResponse = $this->actingAs($this->admin)->put("/categories/{$category->id}", [
            'name' => 'Container Orchestration (K8s)',
            'description' => 'Updated description',
            'is_active' => true,
        ]);

        $updateResponse->assertRedirect();
        $this->assertDatabaseHas('audit_logs', [
            'event' => 'category_updated',
            'auditable_type' => Category::class,
            'auditable_id' => $category->id,
            'user_id' => $this->admin->id,
        ]);
    }
}

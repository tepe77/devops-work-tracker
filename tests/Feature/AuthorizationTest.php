<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\InfrastructureAsset;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $viewer;
    protected Category $category;
    protected Task $task;
    protected InfrastructureAsset $asset;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => UserRole::Admin,
            'is_active' => true,
        ]);

        $this->viewer = User::factory()->create([
            'role' => UserRole::Viewer,
            'is_active' => true,
        ]);

        $this->category = Category::create([
            'name' => 'Server Administration',
            'slug' => 'server-administration',
            'is_active' => true,
        ]);

        $this->asset = InfrastructureAsset::create([
            'name' => 'web-prod-01',
            'asset_type' => 'virtual_machine',
            'environment' => 'production',
            'hostname' => 'web-01.internal',
            'ip_address' => '10.10.0.10',
            'status' => 'active',
        ]);

        $this->task = Task::create([
            'task_code' => 'DWT-2026-0001',
            'title' => 'Initial Server Setup',
            'description' => 'Configuring Nginx and firewall',
            'category_id' => $this->category->id,
            'created_by' => $this->admin->id,
            'priority' => 'high',
            'status' => 'in_progress',
            'progress_percent' => 50,
            'start_date' => now()->toDateString(),
        ]);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
        $this->get('/tasks')->assertRedirect('/login');
        $this->get('/infrastructure')->assertRedirect('/login');
        $this->get('/reports')->assertRedirect('/login');
        $this->get('/audit-logs')->assertRedirect('/login');
    }

    public function test_viewer_can_view_read_only_pages(): void
    {
        $this->actingAs($this->viewer)->get('/dashboard')->assertOk();
        $this->actingAs($this->viewer)->get('/tasks')->assertOk();
        $this->actingAs($this->viewer)->get("/tasks/{$this->task->id}")->assertOk();
        $this->actingAs($this->viewer)->get('/infrastructure')->assertOk();
        $this->actingAs($this->viewer)->get("/infrastructure/{$this->asset->id}")->assertOk();
        $this->actingAs($this->viewer)->get('/reports')->assertOk();
    }

    public function test_viewer_receives_forbidden_on_task_mutation(): void
    {
        // Try creating task
        $response = $this->actingAs($this->viewer)->post('/tasks', [
            'title' => 'Viewer Task',
            'description' => 'Should fail',
            'category_id' => $this->category->id,
            'priority' => 'low',
            'start_date' => now()->toDateString(),
        ]);
        $response->assertForbidden();

        // Try updating task
        $response = $this->actingAs($this->viewer)->put("/tasks/{$this->task->id}", [
            'title' => 'Hacked Task',
            'description' => 'Should fail',
            'category_id' => $this->category->id,
            'priority' => 'low',
            'start_date' => now()->toDateString(),
        ]);
        $response->assertForbidden();

        // Try deleting task
        $response = $this->actingAs($this->viewer)->delete("/tasks/{$this->task->id}");
        $response->assertForbidden();
    }

    public function test_viewer_receives_forbidden_on_task_activity_update(): void
    {
        $response = $this->actingAs($this->viewer)->post("/tasks/{$this->task->id}/updates", [
            'activity_date' => now()->toDateString(),
            'summary' => 'Viewer Update',
            'work_done' => 'Illegal write',
            'progress_percent' => 60,
            'status' => 'in_progress',
        ]);
        $response->assertForbidden();
    }

    public function test_viewer_receives_forbidden_on_infrastructure_mutation(): void
    {
        $response = $this->actingAs($this->viewer)->post('/infrastructure', [
            'name' => 'hacked-server',
            'asset_type' => 'virtual_machine',
            'environment' => 'production',
            'status' => 'active',
        ]);
        $response->assertForbidden();

        $response = $this->actingAs($this->viewer)->delete("/infrastructure/{$this->asset->id}");
        $response->assertForbidden();
    }

    public function test_viewer_receives_forbidden_on_user_management(): void
    {
        $response = $this->actingAs($this->viewer)->get('/users');
        $response->assertForbidden();

        $response = $this->actingAs($this->viewer)->post('/users', [
            'name' => 'New User',
            'email' => 'new@devops.internal',
            'password' => 'password123',
            'role' => 'viewer',
        ]);
        $response->assertForbidden();
    }

    public function test_inactive_user_cannot_access_application(): void
    {
        $this->viewer->update(['is_active' => false]);

        $response = $this->actingAs($this->viewer)->get('/dashboard');
        $response->assertRedirect('/login');
        $this->assertGuest();
    }
}

<?php

namespace Tests\Feature;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExecutiveBoardTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => UserRole::Admin,
            'is_active' => true,
        ]);

        $this->category = Category::create([
            'name' => 'Database Administration',
            'slug' => 'database-administration',
            'is_active' => true,
        ]);

        Task::create([
            'task_code' => 'DWT-2026-0001',
            'title' => 'PostgreSQL Cluster Failover Simulation',
            'description' => 'Testing automatic failover switch',
            'category_id' => $this->category->id,
            'created_by' => $this->admin->id,
            'priority' => TaskPriority::High->value,
            'status' => TaskStatus::InProgress->value,
            'progress_percent' => 70,
            'start_date' => now()->toDateString(),
            'due_date' => now()->addDays(3)->toDateString(),
        ]);
    }

    public function test_guest_can_access_executive_board_without_login(): void
    {
        $response = $this->get('/board');

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Executive/Board')
                ->has('metrics')
                ->has('inProgressTasks')
                ->has('blockedTasks')
                ->has('recentlyCompleted')
                ->has('tasks.data')
        );
    }

    public function test_executive_board_alias_redirects_to_board(): void
    {
        $response = $this->get('/executive');

        $response->assertRedirect('/board');
    }

    public function test_authenticated_admin_can_access_executive_board(): void
    {
        $response = $this->actingAs($this->admin)->get('/board');

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Executive/Board'));
    }

    public function test_executive_board_filters_by_category(): void
    {
        $response = $this->get('/board?category_id=' . $this->category->id);

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->where('filters.category_id', (string) $this->category->id)
        );
    }

    public function test_executive_board_loads_evidences_with_tasks_and_updates(): void
    {
        $task = Task::first();
        $update = $task->updates()->create([
            'user_id' => $this->admin->id,
            'activity_date' => now()->toDateString(),
            'summary' => 'Initial failover test',
            'work_done' => 'Configured replication stream',
            'progress_percent' => 50,
            'status' => TaskStatus::InProgress->value,
        ]);

        $task->evidences()->create([
            'task_update_id' => $update->id,
            'uploaded_by' => $this->admin->id,
            'original_name' => 'failover_screenshot.webp',
            'storage_path' => 'evidences/failover_screenshot.webp',
            'mime_type' => 'image/webp',
            'file_size' => 102400,
            'caption' => 'Bukti failover berhasil',
        ]);

        $response = $this->actingAs($this->admin)->get('/board');

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->has('inProgressTasks.0.updates.0.evidences', 1)
        );
    }
}

<?php

namespace Tests\Feature;

use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\Category;
use App\Models\InfrastructureAsset;
use App\Models\Task;
use App\Models\TaskUpdate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected Category $category;
    protected InfrastructureAsset $asset1;
    protected InfrastructureAsset $asset2;

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

        $this->asset1 = InfrastructureAsset::create([
            'name' => 'db-primary',
            'asset_type' => 'database',
            'environment' => 'production',
            'ip_address' => '10.0.1.5',
            'status' => 'active',
        ]);

        $this->asset2 = InfrastructureAsset::create([
            'name' => 'db-replica',
            'asset_type' => 'database',
            'environment' => 'production',
            'ip_address' => '10.0.1.6',
            'status' => 'active',
        ]);
    }

    public function test_admin_can_create_task_with_assets_and_unique_code(): void
    {
        $response = $this->actingAs($this->admin)->post('/tasks', [
            'title' => 'Upgrade PostgreSQL to v16',
            'description' => 'Perform backup, upgrade binary, and verify replication.',
            'category_id' => $this->category->id,
            'priority' => 'critical',
            'start_date' => now()->toDateString(),
            'due_date' => now()->addDays(3)->toDateString(),
            'asset_ids' => [$this->asset1->id, $this->asset2->id],
        ]);

        $task = Task::first();
        $this->assertNotNull($task);
        $this->assertStringStartsWith('DWT-', $task->task_code);
        $this->assertEquals(TaskStatus::Backlog, $task->status);
        $this->assertEquals(0, $task->progress_percent);
        $this->assertCount(2, $task->assets);

        // Verify audit log
        $this->assertDatabaseHas('audit_logs', [
            'event' => 'task_created',
            'auditable_type' => Task::class,
            'auditable_id' => $task->id,
        ]);
    }

    public function test_admin_can_record_multiple_daily_updates_preserving_history(): void
    {
        $task = Task::create([
            'task_code' => 'DWT-2026-0001',
            'title' => 'Upgrade PostgreSQL to v16',
            'description' => 'Upgrade task',
            'category_id' => $this->category->id,
            'created_by' => $this->admin->id,
            'priority' => 'critical',
            'status' => 'backlog',
            'progress_percent' => 0,
            'start_date' => now()->toDateString(),
        ]);

        // Day 1: Start investigation & preparation
        $this->actingAs($this->admin)->post("/tasks/{$task->id}/updates", [
            'activity_date' => now()->toDateString(),
            'summary' => 'Persiapan backup database sebelum upgrade',
            'work_done' => 'Dijalankan pg_dumpall ke storage backup private.',
            'result' => 'Backup 45GB berhasil tersimpan.',
            'next_action' => 'Uji pg_upgrade pada instance staging.',
            'progress_percent' => 30,
            'status' => 'in_progress',
        ]);

        $task->refresh();
        $this->assertEquals(TaskStatus::InProgress, $task->status);
        $this->assertEquals(30, $task->progress_percent);
        $this->assertCount(1, $task->updates);

        // Day 2: Encounter a blocker
        $this->actingAs($this->admin)->post("/tasks/{$task->id}/updates", [
            'activity_date' => now()->addDay()->toDateString(),
            'summary' => 'Kendala ekstensi pg_stat_statements kompatibilitas',
            'work_done' => 'Verifikasi pre-check upgrade menghasilkan warning ekstensi.',
            'blocker' => 'Perlu compile ekstensi khusus untuk distro Ubuntu 22.04.',
            'next_action' => 'Hubungi vendor repositori Debian/Ubuntu.',
            'progress_percent' => 30,
            'status' => 'blocked',
        ]);

        $task->refresh();
        $this->assertEquals(TaskStatus::Blocked, $task->status);
        $this->assertEquals(30, $task->progress_percent);
        // Ensure day 1 history is preserved!
        $this->assertCount(2, $task->updates);

        // Day 3: Resolved & completed
        $this->actingAs($this->admin)->post("/tasks/{$task->id}/updates", [
            'activity_date' => now()->addDays(2)->toDateString(),
            'summary' => 'Upgrade selesai dan cluster aktif kembali',
            'work_done' => 'Upgrade berhasil, checksum valid, replikasi streaming sinkron.',
            'result' => 'Cluster production berjalan di PG 16.4 dengan latency < 5ms.',
            'progress_percent' => 100,
            'status' => 'completed',
        ]);

        $task->refresh();
        $this->assertEquals(TaskStatus::Completed, $task->status);
        $this->assertEquals(100, $task->progress_percent);
        $this->assertNotNull($task->completed_at);
        $this->assertCount(3, $task->updates);
    }

    public function test_invalid_status_and_progress_is_rejected(): void
    {
        $task = Task::create([
            'task_code' => 'DWT-2026-0001',
            'title' => 'Task',
            'description' => 'Test',
            'category_id' => $this->category->id,
            'created_by' => $this->admin->id,
            'priority' => 'medium',
            'status' => 'backlog',
            'progress_percent' => 0,
            'start_date' => now()->toDateString(),
        ]);

        // Completed requires 100%
        $response = $this->actingAs($this->admin)->post("/tasks/{$task->id}/updates", [
            'activity_date' => now()->toDateString(),
            'summary' => 'Invalid update',
            'work_done' => 'Wrong progress',
            'progress_percent' => 50,
            'status' => 'completed',
        ]);
        $response->assertSessionHasErrors('progress_percent');

        // In progress cannot be 0% or 100%
        $response = $this->actingAs($this->admin)->post("/tasks/{$task->id}/updates", [
            'activity_date' => now()->toDateString(),
            'summary' => 'Invalid update 2',
            'work_done' => 'Wrong progress',
            'progress_percent' => 0,
            'status' => 'in_progress',
        ]);
        $response->assertSessionHasErrors('progress_percent');
    }
}

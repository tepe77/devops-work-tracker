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

    public function test_admin_can_record_backdated_activity_from_past_week(): void
    {
        $task = Task::create([
            'task_code' => 'DWT-2026-0002',
            'title' => 'Retroactive task',
            'description' => 'Logging past activity',
            'category_id' => $this->category->id,
            'created_by' => $this->admin->id,
            'priority' => 'medium',
            'status' => 'backlog',
            'progress_percent' => 0,
            'start_date' => now()->subDays(10)->toDateString(),
        ]);

        $pastDate = now()->subDays(7)->toDateString();

        $response = $this->actingAs($this->admin)->post("/tasks/{$task->id}/updates", [
            'activity_date' => $pastDate,
            'summary' => 'Pekerjaan minggu lalu',
            'work_done' => 'Setup awal konfigurasi server',
            'progress_percent' => 40,
            'status' => 'in_progress',
        ]);

        $response->assertRedirect("/tasks/{$task->id}");
        $response->assertSessionHas('success');

        $task->refresh();
        $this->assertEquals(TaskStatus::InProgress, $task->status);
        $this->assertEquals(40, $task->progress_percent);
        $this->assertCount(1, $task->updates);
        $this->assertEquals($pastDate, $task->updates->first()->activity_date->toDateString());
    }

    public function test_admin_can_update_existing_task_activity(): void
    {
        $task = Task::create([
            'task_code' => 'DWT-2026-0003',
            'title' => 'Migration task',
            'description' => 'Test edit update',
            'category_id' => $this->category->id,
            'created_by' => $this->admin->id,
            'priority' => 'high',
            'status' => 'backlog',
            'progress_percent' => 0,
            'start_date' => now()->toDateString(),
        ]);

        $update = TaskUpdate::create([
            'task_id' => $task->id,
            'user_id' => $this->admin->id,
            'activity_date' => now()->subDay()->toDateString(),
            'summary' => 'Initial summary',
            'work_done' => 'Initial work done',
            'progress_percent' => 25,
            'status' => TaskStatus::InProgress,
        ]);
        $task->update(['status' => TaskStatus::InProgress, 'progress_percent' => 25]);

        $response = $this->actingAs($this->admin)->put("/tasks/{$task->id}/updates/{$update->id}", [
            'activity_date' => now()->subDays(2)->toDateString(),
            'summary' => 'Updated summary with typo fixed',
            'work_done' => 'Updated work done with accurate CLI commands',
            'result' => 'Service verified running',
            'blocker' => null,
            'next_action' => 'Proceed to stage 2',
            'progress_percent' => 60,
            'status' => 'in_progress',
        ]);

        $response->assertRedirect("/tasks/{$task->id}");
        $response->assertSessionHas('success');

        $update->refresh();
        $this->assertEquals('Updated summary with typo fixed', $update->summary);
        $this->assertEquals(60, $update->progress_percent);
        $this->assertEquals(now()->subDays(2)->toDateString(), $update->activity_date->toDateString());

        $task->refresh();
        $this->assertEquals(60, $task->progress_percent);
        $this->assertEquals(TaskStatus::InProgress, $task->status);

        // Audit log check
        $this->assertDatabaseHas('audit_logs', [
            'event' => 'task_update_modified',
            'auditable_type' => TaskUpdate::class,
            'auditable_id' => $update->id,
        ]);
    }

    public function test_admin_can_delete_task_activity_and_task_reverts_state(): void
    {
        $task = Task::create([
            'task_code' => 'DWT-2026-0004',
            'title' => 'Cluster setup',
            'description' => 'Test delete update',
            'category_id' => $this->category->id,
            'created_by' => $this->admin->id,
            'priority' => 'high',
            'status' => 'backlog',
            'progress_percent' => 0,
            'start_date' => now()->subDays(5)->toDateString(),
        ]);

        // First update: 40% in_progress on subDays(3)
        $update1 = TaskUpdate::create([
            'task_id' => $task->id,
            'user_id' => $this->admin->id,
            'activity_date' => now()->subDays(3)->toDateString(),
            'summary' => 'Day 1 setup',
            'work_done' => 'Configured nodes',
            'progress_percent' => 40,
            'status' => TaskStatus::InProgress,
        ]);

        // Second update: 100% completed today
        $update2 = TaskUpdate::create([
            'task_id' => $task->id,
            'user_id' => $this->admin->id,
            'activity_date' => now()->toDateString(),
            'summary' => 'Day 2 completion accidental',
            'work_done' => 'Marked finished prematurely',
            'progress_percent' => 100,
            'status' => TaskStatus::Completed,
        ]);
        $task->update([
            'status' => TaskStatus::Completed,
            'progress_percent' => 100,
            'completed_at' => now(),
        ]);

        // Delete the accidental completed update
        $response = $this->actingAs($this->admin)->delete("/tasks/{$task->id}/updates/{$update2->id}");

        $response->assertRedirect("/tasks/{$task->id}");
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('task_updates', ['id' => $update2->id]);

        $task->refresh();
        // Task must revert to update1's state!
        $this->assertEquals(TaskStatus::InProgress, $task->status);
        $this->assertEquals(40, $task->progress_percent);
        $this->assertNull($task->completed_at);

        // Delete update1 as well: task should revert to backlog 0%
        $this->actingAs($this->admin)->delete("/tasks/{$task->id}/updates/{$update1->id}");

        $task->refresh();
        $this->assertEquals(TaskStatus::Backlog, $task->status);
        $this->assertEquals(0, $task->progress_percent);
        $this->assertNull($task->completed_at);
    }

    public function test_viewer_cannot_update_or_delete_task_activity(): void
    {
        $viewer = User::factory()->create([
            'role' => UserRole::Viewer,
            'is_active' => true,
        ]);

        $task = Task::create([
            'task_code' => 'DWT-2026-0005',
            'title' => 'Viewer test',
            'description' => 'Test permissions',
            'category_id' => $this->category->id,
            'created_by' => $this->admin->id,
            'priority' => 'low',
            'status' => 'in_progress',
            'progress_percent' => 50,
            'start_date' => now()->toDateString(),
        ]);

        $update = TaskUpdate::create([
            'task_id' => $task->id,
            'user_id' => $this->admin->id,
            'activity_date' => now()->toDateString(),
            'summary' => 'Admin update',
            'work_done' => 'Work',
            'progress_percent' => 50,
            'status' => TaskStatus::InProgress,
        ]);

        $response = $this->actingAs($viewer)->put("/tasks/{$task->id}/updates/{$update->id}", [
            'activity_date' => now()->toDateString(),
            'summary' => 'Hacked summary',
            'work_done' => 'Hacked work',
            'progress_percent' => 80,
            'status' => 'in_progress',
        ]);
        $response->assertForbidden();

        $responseDel = $this->actingAs($viewer)->delete("/tasks/{$task->id}/updates/{$update->id}");
        $responseDel->assertForbidden();
    }
}

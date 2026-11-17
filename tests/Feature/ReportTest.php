<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Task;
use App\Models\TaskUpdate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    protected User $viewer;
    protected Task $task;

    protected function setUp(): void
    {
        parent::setUp();

        $admin = User::factory()->create(['role' => UserRole::Admin, 'is_active' => true]);
        $this->viewer = User::factory()->create(['role' => UserRole::Viewer, 'is_active' => true]);

        $category = Category::create(['name' => 'Deployment & CI/CD', 'slug' => 'deployment-cicd']);

        $this->task = Task::create([
            'task_code' => 'DWT-2026-0001',
            'title' => 'GitLab Runner Scaling',
            'description' => 'Configuring docker auto-scaler',
            'category_id' => $category->id,
            'created_by' => $admin->id,
            'priority' => 'high',
            'status' => 'completed',
            'progress_percent' => 100,
            'start_date' => '2026-11-10',
            'completed_at' => '2026-11-12 10:00:00',
        ]);

        TaskUpdate::create([
            'task_id' => $this->task->id,
            'user_id' => $admin->id,
            'activity_date' => '2026-11-10',
            'summary' => 'Runner instance configured',
            'work_done' => 'Configured docker socket binding',
            'progress_percent' => 100,
            'status' => 'completed',
        ]);
    }

    public function test_daily_report_loads_matching_date(): void
    {
        $response = $this->actingAs($this->viewer)->get('/reports?type=daily&date=2026-11-10');
        $response->assertOk();
    }

    public function test_weekly_report_loads(): void
    {
        $response = $this->actingAs($this->viewer)->get('/reports?type=weekly&start_date=2026-11-09&end_date=2026-11-15');
        $response->assertOk();
    }

    public function test_monthly_report_loads(): void
    {
        $response = $this->actingAs($this->viewer)->get('/reports?type=monthly&year=2026&month=11');
        $response->assertOk();
    }

    public function test_pdf_export_downloads_snapshot(): void
    {
        $response = $this->actingAs($this->viewer)->get('/reports/export?type=daily&date=2026-11-10');
        $response->assertOk();
        $this->assertStringContainsString('application/pdf', $response->headers->get('Content-Type'));
        $this->assertStringContainsString('attachment;', $response->headers->get('Content-Disposition'));
    }
}

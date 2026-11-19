<?php

namespace Tests\Feature;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use App\Services\ExecutiveAccessService;
use Carbon\Carbon;
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

    public function test_guest_with_valid_daily_token_can_access_executive_board(): void
    {
        $dailyToken = ExecutiveAccessService::generateDailyToken();
        $response = $this->get('/board/' . $dailyToken);

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Executive/Board')
                ->where('access.status', 'valid')
                ->where('access.daily_token', $dailyToken)
                ->has('metrics')
                ->has('inProgressTasks')
                ->has('blockedTasks')
                ->has('recentlyCompleted')
                ->has('tasks.data')
        );
    }

    public function test_guest_without_token_sees_missing_token_status_with_guarded_data(): void
    {
        $response = $this->get('/board');

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Executive/Board')
                ->where('access.status', 'missing')
                ->where('inProgressTasks', [])
                ->where('blockedTasks', [])
                ->where('recentlyCompleted', [])
                ->where('tasks.data', [])
        );
    }

    public function test_guest_with_expired_token_sees_expired_popup_status(): void
    {
        $yesterday = Carbon::yesterday('Asia/Jakarta');
        $yesterdayToken = ExecutiveAccessService::generateDailyToken($yesterday);

        $response = $this->get('/board/' . $yesterdayToken);

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Executive/Board')
                ->where('access.status', 'expired')
                ->where('access.daily_token', $yesterdayToken)
                ->where('access.message', 'Link sudah kadaluarsa. Silahkan Hubungi Tim DevOps untuk meminta link yang baru.')
                ->where('inProgressTasks', [])
        );
    }

    public function test_guest_with_invalid_token_sees_invalid_status(): void
    {
        $response = $this->get('/board/20261119-fakehash123456');

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Executive/Board')
                ->where('access.status', 'invalid')
                ->where('inProgressTasks', [])
        );
    }

    public function test_daily_token_is_unique_per_day(): void
    {
        $tokenToday = ExecutiveAccessService::generateDailyToken(Carbon::today('Asia/Jakarta'));
        $tokenTomorrow = ExecutiveAccessService::generateDailyToken(Carbon::tomorrow('Asia/Jakarta'));
        $tokenYesterday = ExecutiveAccessService::generateDailyToken(Carbon::yesterday('Asia/Jakarta'));

        $this->assertNotEquals($tokenToday, $tokenTomorrow);
        $this->assertNotEquals($tokenToday, $tokenYesterday);
        $this->assertNotEquals($tokenTomorrow, $tokenYesterday);
    }

    public function test_executive_board_alias_redirects_to_board_preserving_token(): void
    {
        $dailyToken = ExecutiveAccessService::generateDailyToken();
        $response = $this->get('/executive/' . $dailyToken);

        $response->assertRedirect('/board/' . $dailyToken);
    }

    public function test_authenticated_admin_can_access_executive_board_without_token(): void
    {
        $response = $this->actingAs($this->admin)->get('/board');

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->component('Executive/Board')
                ->where('access.status', 'valid')
                ->where('access.is_authenticated', true)
                ->has('access.daily_url')
        );
    }

    public function test_executive_board_filters_by_category(): void
    {
        $dailyToken = ExecutiveAccessService::generateDailyToken();
        $response = $this->get('/board/' . $dailyToken . '?category_id=' . $this->category->id);

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->where('filters.category_id', (string) $this->category->id)
                ->where('access.status', 'valid')
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

    public function test_executive_board_supports_period_filter_today_and_sorting(): void
    {
        $dailyToken = ExecutiveAccessService::generateDailyToken();
        $response = $this->get('/board/' . $dailyToken . '?period=today&sort_by=latest_activity');

        $response->assertOk();
        $response->assertInertia(fn ($page) => 
            $page->where('filters.period', 'today')
                ->where('filters.sort_by', 'latest_activity')
                ->has('todayPulse')
                ->has('todayPulse.activities_count')
                ->has('todayPulse.date_formatted')
        );
    }
}

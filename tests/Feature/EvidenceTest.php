<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Evidence;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class EvidenceTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $viewer;
    protected Task $task;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('private');

        $this->admin = User::factory()->create(['role' => UserRole::Admin, 'is_active' => true]);
        $this->viewer = User::factory()->create(['role' => UserRole::Viewer, 'is_active' => true]);

        $category = Category::create(['name' => 'Troubleshooting', 'slug' => 'troubleshooting']);

        $this->task = Task::create([
            'task_code' => 'DWT-2026-0001',
            'title' => 'Server Outage Investigation',
            'description' => 'Diagnosing kernel panic',
            'category_id' => $category->id,
            'created_by' => $this->admin->id,
            'priority' => 'critical',
            'status' => 'in_progress',
            'progress_percent' => 50,
            'start_date' => now()->toDateString(),
        ]);
    }

    public function test_admin_can_upload_valid_evidence(): void
    {
        $file = UploadedFile::fake()->create('kernel_dmesg.log', 250, 'text/plain');

        $response = $this->actingAs($this->admin)->post('/evidences', [
            'task_id' => $this->task->id,
            'file' => $file,
            'caption' => 'Output dmesg log saat insiden',
        ]);

        $response->assertSessionHasNoErrors();
        $evidence = Evidence::first();
        $this->assertNotNull($evidence);
        $this->assertEquals('kernel_dmesg.log', $evidence->original_name);

        // Verify stored on private disk with UUID name
        Storage::disk('private')->assertExists($evidence->storage_path);
        $this->assertNotEquals('kernel_dmesg.log', $evidence->storage_path);

        // Verify audit log
        $this->assertDatabaseHas('audit_logs', [
            'event' => 'evidence_uploaded',
            'auditable_type' => Evidence::class,
            'auditable_id' => $evidence->id,
        ]);
    }

    public function test_uploaded_image_is_automatically_compressed_and_converted_to_webp(): void
    {
        $file = UploadedFile::fake()->image('dashboard_error.png', 800, 600);

        $response = $this->actingAs($this->admin)->post('/evidences', [
            'task_id' => $this->task->id,
            'file' => $file,
            'caption' => 'Screenshot investigasi error',
        ]);

        $response->assertSessionHasNoErrors();
        $evidence = Evidence::where('caption', 'Screenshot investigasi error')->first();
        $this->assertNotNull($evidence);
        $this->assertEquals('dashboard_error.webp', $evidence->original_name);
        $this->assertEquals('image/webp', $evidence->mime_type);
        $this->assertStringEndsWith('.webp', $evidence->storage_path);
        Storage::disk('private')->assertExists($evidence->storage_path);
    }

    public function test_large_uploaded_image_is_downscaled_to_max_dimension(): void
    {
        $file = UploadedFile::fake()->image('huge_photo.jpg', 3000, 2000);

        $response = $this->actingAs($this->admin)->post('/evidences', [
            'task_id' => $this->task->id,
            'file' => $file,
            'caption' => 'Foto fisik rak server DC',
        ]);

        $response->assertSessionHasNoErrors();
        $evidence = Evidence::where('caption', 'Foto fisik rak server DC')->first();
        $this->assertNotNull($evidence);
        $this->assertEquals('huge_photo.webp', $evidence->original_name);
        $this->assertEquals('image/webp', $evidence->mime_type);
        $this->assertStringEndsWith('.webp', $evidence->storage_path);

        // Verify stored image dimensions
        $content = Storage::disk('private')->get($evidence->storage_path);
        $gd = imagecreatefromstring($content);
        $this->assertNotFalse($gd);
        $this->assertLessThanOrEqual(1920, imagesx($gd));
        $this->assertLessThanOrEqual(1920, imagesy($gd));
        imagedestroy($gd);
    }

    public function test_uploaded_pdf_or_log_document_preserves_original_format(): void
    {
        $pdf = UploadedFile::fake()->create('runbook.pdf', 500, 'application/pdf');

        $response = $this->actingAs($this->admin)->post('/evidences', [
            'task_id' => $this->task->id,
            'file' => $pdf,
            'caption' => 'SOP Disaster Recovery',
        ]);

        $response->assertSessionHasNoErrors();
        $evidence = Evidence::where('caption', 'SOP Disaster Recovery')->first();
        $this->assertNotNull($evidence);
        $this->assertEquals('runbook.pdf', $evidence->original_name);
        $this->assertEquals('application/pdf', $evidence->mime_type);
        $this->assertStringEndsWith('.pdf', $evidence->storage_path);
    }

    public function test_dangerous_files_are_rejected(): void
    {
        $script = UploadedFile::fake()->create('exploit.sh', 50, 'application/x-sh');

        $response = $this->actingAs($this->admin)->post('/evidences', [
            'task_id' => $this->task->id,
            'file' => $script,
        ]);

        $response->assertSessionHasErrors('file');
        $this->assertDatabaseCount('evidences', 0);
    }

    public function test_viewer_can_download_evidence_through_authorized_controller(): void
    {
        $file = UploadedFile::fake()->create('architecture_plan.pdf', 500, 'application/pdf');
        $this->actingAs($this->admin)->post('/evidences', [
            'task_id' => $this->task->id,
            'file' => $file,
        ]);

        $evidence = Evidence::first();

        // Viewer downloads
        $response = $this->actingAs($this->viewer)->get("/evidences/{$evidence->id}/download");
        $response->assertOk();
        $response->assertHeader('Content-Disposition');
    }

    public function test_guest_can_view_or_download_evidence_for_executive_board(): void
    {
        $file = UploadedFile::fake()->create('report.pdf', 100, 'application/pdf');
        $this->actingAs($this->admin)->post('/evidences', [
            'task_id' => $this->task->id,
            'file' => $file,
        ]);

        $evidence = Evidence::first();

        auth()->logout();

        $response = $this->get("/evidences/{$evidence->id}/download");
        $response->assertOk();
        $response->assertHeader('Content-Disposition');
    }
}

<?php

namespace App\Services;

use App\Models\Evidence;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class EvidenceService
{
    protected array $allowedMimes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
        'image/gif',
        'text/plain',
        'text/markdown',
        'text/x-markdown',
        'text/csv',
    ];

    protected array $allowedExtensions = [
        'pdf', 'png', 'jpg', 'jpeg', 'webp', 'gif', 'txt', 'log', 'md', 'csv'
    ];

    public function __construct(
        protected AuditLogService $auditLogService,
        protected ImageOptimizationService $imageOptimizer
    ) {}

    /**
     * Store an uploaded evidence file safely on private storage.
     * Automatically downscales and converts images (PNG, JPG, static GIF, WebP) to WebP format.
     */
    public function upload(
        Task $task,
        UploadedFile $file,
        User $uploader,
        ?int $taskUpdateId = null,
        ?string $caption = null
    ): Evidence {
        $extension = strtolower($file->getClientOriginalExtension());
        $mimeType = $file->getMimeType();

        // Validate allowed extensions and MIME types
        if (!in_array($extension, $this->allowedExtensions) || !in_array($mimeType, $this->allowedMimes)) {
            throw ValidationException::withMessages([
                'file' => "Format file tidak diizinkan ({$extension}). Format yang didukung: PNG, JPG, WebP, GIF, PDF, TXT, LOG, MD, CSV.",
            ]);
        }

        // Limit size: 10MB = 10 * 1024 * 1024 bytes
        $maxBytes = 10 * 1024 * 1024;
        if ($file->getSize() > $maxBytes) {
            throw ValidationException::withMessages([
                'file' => 'Ukuran file melebihi batas maksimum 10 MB.',
            ]);
        }

        // Process image optimization (resizing & WebP compression)
        $optimized = $this->imageOptimizer->optimize($file);

        if ($optimized['is_converted'] && !empty($optimized['temp_path'])) {
            $storedName = Str::uuid()->toString() . '.' . $optimized['extension'];
            $path = 'evidences/' . $storedName;

            $stream = fopen($optimized['temp_path'], 'r');
            Storage::disk('private')->put($path, $stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
            @unlink($optimized['temp_path']);

            $finalMime = $optimized['mime_type'];
            $finalSize = $optimized['file_size'];
            $finalOriginalName = $optimized['original_name'];
        } else {
            // Passthrough for non-converted files (e.g. PDF, LOG, TXT, animated GIF)
            $storedName = Str::uuid()->toString() . '.' . $extension;
            $path = $file->storeAs('evidences', $storedName, 'private');
            $finalMime = $mimeType;
            $finalSize = $file->getSize();
            $finalOriginalName = $file->getClientOriginalName();
        }

        $evidence = Evidence::create([
            'task_id' => $task->id,
            'task_update_id' => $taskUpdateId,
            'uploaded_by' => $uploader->id,
            'original_name' => $finalOriginalName,
            'storage_path' => $path,
            'mime_type' => $finalMime,
            'file_size' => $finalSize,
            'caption' => $caption,
        ]);

        $this->auditLogService->log(
            event: 'evidence_uploaded',
            model: $evidence,
            newValues: [
                'task_code' => $task->task_code,
                'original_name' => $evidence->original_name,
                'file_size' => $evidence->file_size,
            ],
            userId: $uploader->id
        );

        return $evidence;
    }

    /**
     * Download or view an evidence file securely.
     */
    public function download(Evidence $evidence, bool $inline = false): Response|StreamedResponse
    {
        if (!Storage::disk('private')->exists($evidence->storage_path)) {
            abort(404, 'File evidence tidak ditemukan di server.');
        }

        $headers = [
            'Content-Type' => $evidence->mime_type,
            'Content-Disposition' => ($inline ? 'inline' : 'attachment') . '; filename="' . addslashes($evidence->original_name) . '"',
            'X-Content-Type-Options' => 'nosniff',
        ];

        if ($inline) {
            return Storage::disk('private')->response($evidence->storage_path, $evidence->original_name, $headers);
        }

        return Storage::disk('private')->download($evidence->storage_path, $evidence->original_name, $headers);
    }

    /**
     * Delete an evidence record and its underlying physical file.
     */
    public function delete(Evidence $evidence, ?User $actor = null): void
    {
        $path = $evidence->storage_path;

        $this->auditLogService->log(
            event: 'evidence_deleted',
            model: $evidence,
            oldValues: [
                'original_name' => $evidence->original_name,
                'task_id' => $evidence->task_id,
            ],
            userId: $actor?->id
        );

        $evidence->delete();

        if (Storage::disk('private')->exists($path)) {
            Storage::disk('private')->delete($path);
        }
    }
}

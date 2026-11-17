<?php

namespace App\Http\Requests;

use App\Enums\TaskStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateTaskUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'activity_date' => ['required', 'date'],
            'summary' => ['required', 'string', 'max:255'],
            'work_done' => ['required', 'string'],
            'result' => ['nullable', 'string'],
            'blocker' => ['nullable', 'string'],
            'next_action' => ['nullable', 'string'],
            'progress_percent' => ['required', 'integer', 'min:0', 'max:100'],
            'status' => ['required', new Enum(TaskStatus::class)],
            'evidence_file' => ['nullable', 'file', 'max:10240', 'mimes:pdf,png,jpg,jpeg,webp,gif,txt,log,md,csv'],
            'evidence_caption' => ['nullable', 'string', 'max:255'],
        ];
    }
}

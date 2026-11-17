<?php

namespace App\Http\Requests;

use App\Enums\TaskPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateTaskRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string'],
            'project_id' => ['nullable', 'exists:projects,id'],
            'category_id' => ['required', 'exists:categories,id'],
            'priority' => ['required', new Enum(TaskPriority::class)],
            'start_date' => ['required', 'date'],
            'due_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'asset_ids' => ['nullable', 'array'],
            'asset_ids.*' => ['exists:infrastructure_assets,id'],
        ];
    }
}

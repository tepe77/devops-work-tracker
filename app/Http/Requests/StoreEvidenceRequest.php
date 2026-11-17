<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEvidenceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'task_id' => ['required', 'exists:tasks,id'],
            'task_update_id' => ['nullable', 'exists:task_updates,id'],
            'file' => ['required', 'file', 'max:10240', 'mimes:pdf,png,jpg,jpeg,webp,gif,txt,log,md,csv'],
            'caption' => ['nullable', 'string', 'max:255'],
        ];
    }
}

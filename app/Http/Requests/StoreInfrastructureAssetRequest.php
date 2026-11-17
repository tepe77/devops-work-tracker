<?php

namespace App\Http\Requests;

use App\Enums\AssetEnvironment;
use App\Enums\AssetStatus;
use App\Enums\AssetType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreInfrastructureAssetRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'asset_type' => ['required', new Enum(AssetType::class)],
            'environment' => ['required', new Enum(AssetEnvironment::class)],
            'hostname' => ['nullable', 'string', 'max:255'],
            'ip_address' => ['nullable', 'string', 'max:64'],
            'operating_system' => ['nullable', 'string', 'max:255'],
            'purpose' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['required', new Enum(AssetStatus::class)],
        ];
    }
}

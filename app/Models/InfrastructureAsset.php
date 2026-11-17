<?php

namespace App\Models;

use App\Enums\AssetEnvironment;
use App\Enums\AssetStatus;
use App\Enums\AssetType;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class InfrastructureAsset extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'asset_type',
        'environment',
        'hostname',
        'ip_address',
        'operating_system',
        'purpose',
        'description',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'asset_type' => AssetType::class,
            'environment' => AssetEnvironment::class,
            'status' => AssetStatus::class,
        ];
    }

    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'task_assets', 'infrastructure_asset_id', 'task_id')
            ->withTimestamps();
    }
}

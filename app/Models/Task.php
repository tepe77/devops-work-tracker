<?php

namespace App\Models;

use App\Enums\TaskPriority;
use App\Enums\TaskStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'task_code',
        'title',
        'description',
        'project_id',
        'category_id',
        'created_by',
        'priority',
        'status',
        'progress_percent',
        'start_date',
        'due_date',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'priority' => TaskPriority::class,
            'status' => TaskStatus::class,
            'progress_percent' => 'integer',
            'start_date' => 'date',
            'due_date' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assets(): BelongsToMany
    {
        return $this->belongsToMany(InfrastructureAsset::class, 'task_assets', 'task_id', 'infrastructure_asset_id')
            ->withTimestamps();
    }

    public function updates(): HasMany
    {
        return $this->hasMany(TaskUpdate::class)->orderBy('activity_date', 'desc')->orderBy('created_at', 'desc');
    }

    public function evidences(): HasMany
    {
        return $this->hasMany(Evidence::class)->latest();
    }
}

<?php

namespace App\Models;

use App\Enums\TaskStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TaskUpdate extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'user_id',
        'activity_date',
        'summary',
        'work_done',
        'result',
        'blocker',
        'next_action',
        'progress_percent',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'activity_date' => 'date',
            'status' => TaskStatus::class,
            'progress_percent' => 'integer',
        ];
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function evidences(): HasMany
    {
        return $this->hasMany(Evidence::class, 'task_update_id');
    }
}

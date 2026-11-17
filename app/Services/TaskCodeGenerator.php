<?php

namespace App\Services;

use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class TaskCodeGenerator
{
    /**
     * Generate a unique, race-condition-safe task code formatted as DWT-YYYY-NNNN.
     */
    public function generate(?int $year = null): string
    {
        $year = $year ?? Carbon::now('Asia/Jakarta')->year;
        $prefix = "DWT-{$year}-";

        return DB::transaction(function () use ($prefix, $year) {
            // Find the highest sequence number for this year, including soft-deleted tasks
            $latestTask = Task::withTrashed()
                ->where('task_code', 'like', "{$prefix}%")
                ->lockForUpdate()
                ->orderBy('task_code', 'desc')
                ->first();

            $nextNumber = 1;
            if ($latestTask) {
                $parts = explode('-', $latestTask->task_code);
                if (count($parts) >= 3 && is_numeric(end($parts))) {
                    $nextNumber = ((int) end($parts)) + 1;
                }
            }

            // Ensure uniqueness with safeguard
            do {
                $code = sprintf("%s%04d", $prefix, $nextNumber);
                $exists = Task::withTrashed()->where('task_code', $code)->exists();
                if ($exists) {
                    $nextNumber++;
                }
            } while ($exists);

            return $code;
        });
    }
}

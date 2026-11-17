<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class AuditLogService
{
    /**
     * Log a state mutation.
     */
    public function log(
        string $event,
        Model $model,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?array $metadata = null,
        ?int $userId = null
    ): AuditLog {
        $actorId = $userId ?? Auth::id();

        // Sanitize sensitive fields from old and new values
        $sanitizedOld = $oldValues ? $this->sanitize($oldValues) : null;
        $sanitizedNew = $newValues ? $this->sanitize($newValues) : null;

        return AuditLog::create([
            'user_id' => $actorId,
            'event' => $event,
            'auditable_type' => get_class($model),
            'auditable_id' => $model->getKey(),
            'old_values' => $sanitizedOld,
            'new_values' => $sanitizedNew,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }

    /**
     * Remove sensitive keys such as password, token, keys.
     */
    protected function sanitize(array $data): array
    {
        $sensitiveKeys = [
            'password',
            'remember_token',
            'token',
            'secret',
            'api_key',
            'ssh_key',
            'private_key',
        ];

        foreach ($sensitiveKeys as $key) {
            if (array_key_exists($key, $data)) {
                $data[$key] = '[REDACTED]';
            }
        }

        return $data;
    }
}

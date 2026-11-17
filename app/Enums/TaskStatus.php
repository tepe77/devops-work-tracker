<?php

namespace App\Enums;

enum TaskStatus: string
{
    case Backlog = 'backlog';
    case InProgress = 'in_progress';
    case Blocked = 'blocked';
    case Completed = 'completed';
    case Cancelled = 'cancelled';

    public function label(): string
    {
        return match ($this) {
            self::Backlog => 'Backlog',
            self::InProgress => 'In Progress',
            self::Blocked => 'Blocked',
            self::Completed => 'Completed',
            self::Cancelled => 'Cancelled',
        };
    }

    public function badgeVariant(): string
    {
        return match ($this) {
            self::Backlog => 'secondary',
            self::InProgress => 'info',
            self::Blocked => 'destructive',
            self::Completed => 'success',
            self::Cancelled => 'outline',
        };
    }
}

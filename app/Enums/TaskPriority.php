<?php

namespace App\Enums;

enum TaskPriority: string
{
    case Low = 'low';
    case Medium = 'medium';
    case High = 'high';
    case Critical = 'critical';

    public function label(): string
    {
        return match ($this) {
            self::Low => 'Rendah (Low)',
            self::Medium => 'Sedang (Medium)',
            self::High => 'Tinggi (High)',
            self::Critical => 'Kritis (Critical)',
        };
    }

    public function badgeVariant(): string
    {
        return match ($this) {
            self::Low => 'secondary',
            self::Medium => 'info',
            self::High => 'warning',
            self::Critical => 'destructive',
        };
    }
}

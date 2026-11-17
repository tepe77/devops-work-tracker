<?php

namespace App\Enums;

enum AssetEnvironment: string
{
    case Production = 'production';
    case Staging = 'staging';
    case Development = 'development';
    case DisasterRecovery = 'disaster_recovery';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Production => 'Production',
            self::Staging => 'Staging',
            self::Development => 'Development',
            self::DisasterRecovery => 'Disaster Recovery (DR)',
            self::Other => 'Other',
        };
    }

    public function badgeVariant(): string
    {
        return match ($this) {
            self::Production => 'destructive',
            self::Staging => 'warning',
            self::Development => 'info',
            self::DisasterRecovery => 'purple',
            self::Other => 'secondary',
        };
    }
}

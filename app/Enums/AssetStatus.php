<?php

namespace App\Enums;

enum AssetStatus: string
{
    case Active = 'active';
    case Maintenance = 'maintenance';
    case Retired = 'retired';

    public function label(): string
    {
        return match ($this) {
            self::Active => 'Aktif (Active)',
            self::Maintenance => 'Maintenance',
            self::Retired => 'Retired (Dinonaktifkan)',
        };
    }

    public function badgeVariant(): string
    {
        return match ($this) {
            self::Active => 'success',
            self::Maintenance => 'warning',
            self::Retired => 'outline',
        };
    }
}

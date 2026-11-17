<?php

namespace App\Enums;

enum AssetType: string
{
    case VirtualMachine = 'virtual_machine';
    case PhysicalServer = 'physical_server';
    case Database = 'database';
    case ContainerHost = 'container_host';
    case ApplicationService = 'application_service';
    case Network = 'network';
    case Storage = 'storage';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::VirtualMachine => 'Virtual Machine',
            self::PhysicalServer => 'Physical Server',
            self::Database => 'Database',
            self::ContainerHost => 'Container Host / K8s',
            self::ApplicationService => 'Application Service',
            self::Network => 'Network / Firewall / Gateway',
            self::Storage => 'Storage / S3 / NAS',
            self::Other => 'Lainnya',
        };
    }
}

<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Infrastructure Provisioning',
                'description' => 'Penyediaan dan konfigurasi VM, server fisik, container platform, dan cloud resources.',
            ],
            [
                'name' => 'Server Administration',
                'description' => 'Administrasi sistem operasi Linux/Unix, manajemen user, patching OS, dan konfigurasi server.',
            ],
            [
                'name' => 'Deployment & CI/CD',
                'description' => 'Rilis aplikasi, pipeline GitLab CI/CD, automation testing, dan deployment workflow.',
            ],
            [
                'name' => 'Infrastructure Monitoring',
                'description' => 'Pengawasan performa, log aggregation, alerting Grafana/Prometheus/Uptime Kuma, dan observabilitas.',
            ],
            [
                'name' => 'Database Administration',
                'description' => 'Maintenance database, replikasi, optimasi query/indexing, tuning, dan migrasi skema.',
            ],
            [
                'name' => 'Network & Security',
                'description' => 'Hardening server, firewall, VPN, SSL/TLS certificates, reverse proxy Nginx, dan security compliance.',
            ],
            [
                'name' => 'Troubleshooting & Incident',
                'description' => 'Investigasi insiden production, analisis root cause (RCA), emergency fixes, dan penanganan downtime.',
            ],
            [
                'name' => 'Backup & Disaster Recovery',
                'description' => 'Strategi pencadangan berkala, validasi integritas backup, drill restore database, dan kesiapan DR.',
            ],
            [
                'name' => 'Maintenance & Optimization',
                'description' => 'Pembersihan storage, log rotation, pembersihan container lama, dan efisiensi resource.',
            ],
            [
                'name' => 'Infrastructure Improvement',
                'description' => 'Perancangan arsitektur baru, migrasi arsitektur, high availability (HA), dan otomatisasi infra.',
            ],
            [
                'name' => 'Documentation & Reporting',
                'description' => 'Pembuatan panduan operasional (SOP), dokumentasi topologi infra, dan pelaporan berkala ke atasan.',
            ],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(
                ['slug' => Str::slug($cat['name'])],
                [
                    'name' => $cat['name'],
                    'description' => $cat['description'],
                    'is_active' => true,
                ]
            );
        }
    }
}

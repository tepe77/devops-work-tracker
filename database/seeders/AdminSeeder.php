<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('INITIAL_ADMIN_EMAIL') ?: 'admin@devops.internal';
        $name = env('INITIAL_ADMIN_NAME') ?: 'DevOps Lead';
        $password = env('INITIAL_ADMIN_PASSWORD') ?: 'admin12345';

        if (!User::where('email', $email)->exists()) {
            $admin = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'role' => UserRole::Admin,
                'is_active' => true,
                'email_verified_at' => now(),
            ]);

            AuditLog::create([
                'user_id' => $admin->id,
                'event' => 'user_created',
                'auditable_type' => User::class,
                'auditable_id' => $admin->id,
                'new_values' => ['name' => $admin->name, 'email' => $admin->email, 'role' => 'admin'],
                'metadata' => ['source' => 'system_seeder'],
                'created_at' => now(),
            ]);
        }
    }
}

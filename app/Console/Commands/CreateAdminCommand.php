<?php

namespace App\Console\Commands;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateAdminCommand extends Command
{
    protected $signature = 'app:create-admin 
                            {--name= : Nama lengkap Admin} 
                            {--email= : Alamat email Admin} 
                            {--password= : Password untuk akun Admin}';

    protected $description = 'Membuat akun Admin DevOps Engineer pertama secara aman';

    public function handle(): int
    {
        $this->info('=== Pembuatan Akun Admin DevOps Work Tracker ===');

        $name = $this->option('name') ?: $this->ask('Masukkan Nama Admin');
        $email = $this->option('email') ?: $this->ask('Masukkan Email Admin');
        $password = $this->option('password') ?: $this->secret('Masukkan Password Admin (minimal 8 karakter)');

        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
        ], [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return self::FAILURE;
        }

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => UserRole::Admin,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        $this->info("✓ Akun Admin berhasil dibuat untuk: {$user->email}");
        return self::SUCCESS;
    }
}

<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin() && $user->is_active;
    }

    public function view(User $user, User $model): bool
    {
        return $user->isAdmin() && $user->is_active;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() && $user->is_active;
    }

    public function update(User $user, User $model): bool
    {
        return $user->isAdmin() && $user->is_active;
    }

    public function delete(User $user, User $model): bool
    {
        // Cannot delete self or last admin
        if ($user->id === $model->id) {
            return false;
        }

        return $user->isAdmin() && $user->is_active;
    }
}

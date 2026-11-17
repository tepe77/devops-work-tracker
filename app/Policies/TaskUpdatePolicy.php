<?php

namespace App\Policies;

use App\Models\TaskUpdate;
use App\Models\User;

class TaskUpdatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user, TaskUpdate $update): bool
    {
        return $user->is_active;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() && $user->is_active;
    }
}

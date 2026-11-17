<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user, Project $project): bool
    {
        return $user->is_active;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() && $user->is_active;
    }

    public function update(User $user, Project $project): bool
    {
        return $user->isAdmin() && $user->is_active;
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->isAdmin() && $user->is_active;
    }
}

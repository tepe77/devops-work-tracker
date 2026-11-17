<?php

namespace App\Policies;

use App\Models\Evidence;
use App\Models\User;

class EvidencePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user, Evidence $evidence): bool
    {
        return $user->is_active;
    }

    public function download(User $user, Evidence $evidence): bool
    {
        return $user->is_active;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() && $user->is_active;
    }

    public function delete(User $user, Evidence $evidence): bool
    {
        return $user->isAdmin() && $user->is_active;
    }
}

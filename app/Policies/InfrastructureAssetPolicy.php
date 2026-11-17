<?php

namespace App\Policies;

use App\Models\InfrastructureAsset;
use App\Models\User;

class InfrastructureAssetPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_active;
    }

    public function view(User $user, InfrastructureAsset $asset): bool
    {
        return $user->is_active;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() && $user->is_active;
    }

    public function update(User $user, InfrastructureAsset $asset): bool
    {
        return $user->isAdmin() && $user->is_active;
    }

    public function delete(User $user, InfrastructureAsset $asset): bool
    {
        return $user->isAdmin() && $user->is_active;
    }
}

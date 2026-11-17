<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{
    public function __construct(
        protected AuditLogService $auditLogService
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', User::class);

        $users = User::orderBy('created_at', 'desc')->paginate(15);

        return Inertia::render('Users/Index', [
            'users' => $users,
        ]);
    }

    public function create(): Response
    {
        $this->authorize('create', User::class);

        return Inertia::render('Users/Create');
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $data['password'] = Hash::make($data['password']);
        $data['is_active'] = $data['is_active'] ?? true;
        $data['email_verified_at'] = now();

        $user = User::create($data);

        $this->auditLogService->log(
            event: 'user_created',
            model: $user,
            newValues: ['name' => $user->name, 'email' => $user->email, 'role' => $user->role->value],
            userId: $request->user()->id
        );

        return redirect()->route('users.index')->with('success', "Pengguna {$user->name} berhasil ditambahkan.");
    }

    public function edit(User $user): Response
    {
        $this->authorize('update', $user);

        return Inertia::render('Users/Edit', [
            'user' => $user,
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $data = $request->validated();

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        // Prevent deactivating the only active admin
        if (isset($data['is_active']) && !$data['is_active'] && $user->isAdmin()) {
            $activeAdminCount = User::where('role', UserRole::Admin)->where('is_active', true)->count();
            if ($activeAdminCount <= 1) {
                return back()->withErrors(['is_active' => 'Tidak dapat menonaktifkan satu-satunya Admin aktif pada sistem.']);
            }
        }

        $oldValues = ['name' => $user->name, 'email' => $user->email, 'role' => $user->role->value, 'is_active' => $user->is_active];
        $user->update($data);

        $this->auditLogService->log(
            event: 'user_updated',
            model: $user,
            oldValues: $oldValues,
            newValues: ['name' => $user->name, 'email' => $user->email, 'role' => $user->role->value, 'is_active' => $user->is_active],
            userId: $request->user()->id
        );

        return redirect()->route('users.index')->with('success', "Data pengguna {$user->name} berhasil diperbarui.");
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        $this->authorize('delete', $user);

        if ($user->isAdmin()) {
            $activeAdminCount = User::where('role', UserRole::Admin)->count();
            if ($activeAdminCount <= 1) {
                return back()->withErrors(['error' => 'Tidak dapat menghapus satu-satunya akun Admin.']);
            }
        }

        $this->auditLogService->log(
            event: 'user_deleted',
            model: $user,
            oldValues: ['email' => $user->email],
            userId: $request->user()->id
        );

        $user->delete();

        return redirect()->route('users.index')->with('success', "Akun pengguna {$user->name} telah dihapus.");
    }
}

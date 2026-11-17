<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || $request->user()->role !== UserRole::Admin) {
            abort(403, 'Akses ditolak. Fitur ini hanya dapat diakses oleh Admin (DevOps Engineer).');
        }

        if (!$request->user()->is_active) {
            auth()->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
            return redirect()->route('login')->withErrors(['email' => 'Akun Anda telah dinonaktifkan. Silakan hubungi Administrator.']);
        }

        return $next($request);
    }
}

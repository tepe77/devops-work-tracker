<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $query = AuditLog::with('user');

        if ($event = $request->query('event')) {
            $query->where('event', $event);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('event', 'like', "%{$search}%")
                  ->orWhere('auditable_type', 'like', "%{$search}%")
                  ->orWhere('auditable_id', 'like', "%{$search}%")
                  ->orWhere('new_values', 'like', "%{$search}%")
                  ->orWhere('old_values', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $logs = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        $availableEvents = AuditLog::query()
            ->distinct()
            ->orderBy('event', 'asc')
            ->pluck('event')
            ->toArray();

        return Inertia::render('AuditLogs/Index', [
            'logs' => $logs,
            'availableEvents' => $availableEvents,
            'filters' => $request->only(['event', 'search']),
        ]);
    }
}

<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Fitur;
use App\Models\User;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $totalUsers = User::count();
        $activeUsers = User::where('is_active', true)->count();
        $inactiveUsers = $totalUsers - $activeUsers;

        $rolesCount = User::query()
            ->selectRaw('role, count(*) as count')
            ->groupBy('role')
            ->pluck('count', 'role')
            ->toArray();

        $stats = [
            'total_users' => $totalUsers,
            'active_users' => $activeUsers,
            'inactive_users' => $inactiveUsers,
            'total_fitur' => Fitur::count(),
            'role_breakdown' => $rolesCount,
        ];

        $recentUsers = User::query()
            ->select(['id', 'name', 'email', 'role', 'is_active', 'created_at'])
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->role,
                'status' => $u->is_active ? 'Aktif' : 'Nonaktif',
                'date' => optional($u->created_at)->format('Y-m-d'),
            ]);

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => $stats,
            'recentUsers' => $recentUsers,
        ]);
    }
}

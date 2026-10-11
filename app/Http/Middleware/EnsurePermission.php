<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Granular RBAC gate — usage: middleware('permission:verifikasi,Verifikasi').
 * Super Admin bypasses all checks (see User::can). Unknown combos deny.
 */
class EnsurePermission
{
    public function handle(Request $request, Closure $next, string $fitur, string $aksi = 'Lihat'): Response
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login');
        }

        if (! $user->canDo($fitur, $aksi)) {
            if ($request->expectsJson() || $request->inertia()) {
                return response()->json(['message' => 'Forbidden.'], 403);
            }

            abort(403, 'Anda tidak memiliki akses ke halaman ini.');
        }

        return $next($request);
    }
}

<?php

namespace App\Http\Middleware;

use App\Models\Fitur;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Feature-flag gate — usage: middleware('fitur:pengajuan').
 * Inactive fitur → 403 for everyone (including Super Admin).
 * Missing row (never configured) → allow (fail-open; flag only blocks
 * when explicitly deactivated).
 */
class EnsureFitur
{
    public function handle(Request $request, Closure $next, string $key): Response
    {
        $fitur = Fitur::where('key', $key)->first();

        if ($fitur && ! $fitur->aktif) {
            if ($request->expectsJson() || $request->inertia()) {
                return response()->json(['message' => 'Fitur dinonaktifkan.'], 403);
            }

            abort(403, 'Fitur ini sedang dinonaktifkan.');
        }

        return $next($request);
    }
}

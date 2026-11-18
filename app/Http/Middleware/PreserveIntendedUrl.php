<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Preserve the original URL (intended path) before redirecting to login.
 * This allows us to redirect back to the original page after authentication.
 * 
 * For protected routes (e.g., /pengajuan/create), save the full URL with query params
 * so after login, user returns to where they started.
 */
class PreserveIntendedUrl
{
    public function handle(Request $request, Closure $next): Response
    {
        // If already authenticated, no need to preserve
        if (auth()->check()) {
            return $next($request);
        }

        // List of routes that should preserve intended URL after login
        $protectedRoutes = [
            'customer.pengajuan.create',
            'customer.pengajuan.edit',
            'customer.pembayaran',
        ];

        // Check if current route needs to preserve URL
        $currentRoute = $request->route()?->getName();
        
        if ($currentRoute && in_array($currentRoute, $protectedRoutes, true)) {
            // Save the full URL (including query params) as intended URL
            session(['_intended_url' => $request->getUri()]);
        }

        return $next($request);
    }
}

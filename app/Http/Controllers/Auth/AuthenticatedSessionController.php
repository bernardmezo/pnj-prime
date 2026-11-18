<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Check if there's a preserved intended URL (e.g., from pengajuan/create before login)
        $intendedUrl = session()->pull('_intended_url');
        
        if ($intendedUrl && $this->isValidInternalUrl($intendedUrl)) {
            return redirect($intendedUrl);
        }

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Validate that URL is internal (prevent open redirect).
     */
    private function isValidInternalUrl(?string $url): bool
    {
        if (!$url) {
            return false;
        }

        // Parse URL and check if it's from our domain
        $parsed = parse_url($url);
        $currentHost = request()->getHost();

        // If URL has host and it doesn't match current, it's external → reject
        if (isset($parsed['host']) && $parsed['host'] !== $currentHost) {
            return false;
        }

        // Allow URLs without host (relative paths) or same host
        return true;
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect('/');
    }
}

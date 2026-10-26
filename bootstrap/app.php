<?php

use App\Http\Middleware\EnsureFitur;
use App\Http\Middleware\EnsurePermission;
use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleInertiaRequests::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Register role guard middleware — usage: middleware('role:admin_rtpu')
        // Granular RBAC gate — usage: middleware('permission:verifikasi,Verifikasi')
        // Feature-flag gate — usage: middleware('fitur:pengajuan')
        $middleware->alias([
            'role' => EnsureRole::class,
            'permission' => EnsurePermission::class,
            'fitur' => EnsureFitur::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );

        // Session expiry during an Inertia mutation (POST/PATCH/PUT/DELETE) must
        // not fall back to the default 302 redirect to /login. An XHR follows a
        // 302 while keeping its verb, so the browser replays e.g. PATCH /login —
        // a route that only allows GET/HEAD/POST — and the user sees a confusing
        // 405 instead of the login screen. Signalling an Inertia "location visit"
        // (409 + X-Inertia-Location) makes the client perform a real GET
        // navigation to the login page instead.
        $exceptions->render(function (AuthenticationException $e, Request $request) {
            if ($request->inertia() && ! $request->isMethodSafe()) {
                return Inertia::location(route('login'));
            }

            return null;
        });
    })->create();

<?php

namespace App\Http\Middleware;

use App\Models\Fitur;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user(),
            ],
            // Active feature keys drive menu visibility (see lib/roles.js +
            // DashboardLayout/CustomerTabs filtering). Missing table (fresh
            // install) yields null = show everything.
            'fitur' => Schema::hasTable('fitur')
                ? Fitur::where('aktif', true)->pluck('key')->all()
                : null,
            // SSO is off unless explicitly enabled; the login button reads this.
            'sso_enabled' => (bool) config('services.sso.enabled'),
        ];
    }
}

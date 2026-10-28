<?php

namespace App\Http\Middleware;

use App\Models\ExternalLink;
use App\Models\Fitur;
use App\Models\Pengajuan;
use App\Models\ProdukUnggulan;
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
            // Flash messages from back()->with('success', ...) / with('error', ...)
            'flash' => fn () => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
            // Active feature keys drive menu visibility (see lib/roles.js +
            // DashboardLayout/CustomerTabs filtering). Missing table (fresh
            // install) yields null = show everything.
            'active_fitur' => Schema::hasTable('fitur')
                ? Fitur::where('aktif', true)->pluck('key')->all()
                : null,
            'fitur' => Schema::hasTable('fitur')
                ? Fitur::where('aktif', true)->pluck('key')->all()
                : null,
            // External links for public navigation (LMS, main site, etc.)
            'external_links' => Schema::hasTable('external_links')
                ? ExternalLink::where('is_active', true)->orderBy('sort_order')->get(['id', 'label', 'url', 'target'])
                : [],
            // Pending counts for staff badges (only computed when staff is authenticated)
            'pending_counts' => fn () => ($request->user() && $request->user()->isStaff() && Schema::hasTable('pengajuan'))
                ? [
                    'menunggu_verifikasi' => Pengajuan::where('status', 'Diajukan')->count(),
                    'verifikasi_bayar' => Pengajuan::where('status', 'Menunggu Verifikasi Pembayaran')->count(),
                    'menunggu_pimpinan' => Schema::hasTable('produk_unggulan') ? ProdukUnggulan::where('status', 'Diajukan')->count() : 0,
                ]
                : null,
            // SSO is off unless explicitly enabled; the login button reads this.
            'sso_enabled' => (bool) config('services.sso.enabled'),
        ];
    }
}

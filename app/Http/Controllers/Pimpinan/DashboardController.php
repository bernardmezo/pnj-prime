<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $catalogCounts = Product::with('category.parent')
            ->where('is_active', true)
            ->where('curation_status', 'approved')
            ->get()
            ->countBy(fn ($product) => $product->layananTipe());
        $pendingAccountsCount = \App\Models\User::whereIn('role', ['admin_pengelola', 'admin_jurusan', 'admin_p3m'])
            ->where('account_status', 'pending')
            ->count();
        $stats = [
            'produk' => $catalogCounts->get('produk', 0),
            'sewa' => ($catalogCounts->get('ruangan', 0)) + ($catalogCounts->get('alat', 0)),
            'layanan' => $catalogCounts->get('jasa', 0),
            'akun_pending' => $pendingAccountsCount,
        ];
        $stats['total_katalog'] = $stats['produk'] + $stats['sewa'] + $stats['layanan'];

        $antrean = Product::with('category', 'owner:id,name,phone,nip,jurusan,institution,unit_name')
            ->whereIn('curation_status', ['pending', 'verified'])
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'code' => $p->code ?? '-',
                'researcher' => $p->owner?->name ?? '-',
                'date' => optional($p->created_at)->format('Y-m-d'),
                'status' => $p->curation_status,
            ]);

        $antreanAkun = \App\Models\User::query()
            ->whereIn('role', ['admin_pengelola', 'admin_jurusan', 'admin_p3m'])
            ->where('account_status', 'pending')
            ->latest()
            ->limit(10)
            ->get(['id', 'name', 'role', 'created_at'])
            ->map(fn ($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => \App\Enums\Role::from($user->role)->label(),
                'date' => $user->created_at?->format('Y-m-d'),
            ]);

        return Inertia::render('Pimpinan/Dashboard', [
            'stats' => $stats,
            'antrean' => $antrean,
            'antreanAkun' => $antreanAkun,
        ]);
    }
}

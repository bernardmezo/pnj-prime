<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\Product;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $stats = [
            'menunggu_verifikasi' => Pengajuan::where('status', 'Diajukan')->count(),
            'menunggu_pembayaran' => Pengajuan::where('status', 'Menunggu Pembayaran')->count(),
            'diproses' => Pengajuan::whereIn('status', [
                'Menunggu Verifikasi Pembayaran', 'Diproses',
            ])->count(),
            'total_layanan' => Product::count(),
        ];

        $recentPengajuan = Pengajuan::with('product', 'buyer')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'customer' => $p->buyer?->name ?? '-',
                'layanan' => $p->product?->name ?? '-',
                'date' => optional($p->created_at)->format('Y-m-d'),
                'status' => $p->status,
            ]);

        return Inertia::render('Rtpu/Dashboard', [
            'stats' => $stats,
            'recentPengajuan' => $recentPengajuan,
        ]);
    }
}

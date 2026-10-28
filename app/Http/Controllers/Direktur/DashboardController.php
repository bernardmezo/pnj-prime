<?php

namespace App\Http\Controllers\Direktur;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\ProdukUnggulan;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $allProduk = ProdukUnggulan::all();
        $allPengajuan = Pengajuan::with('product')->get();

        $completedPengajuan = $allPengajuan->where('status', 'Selesai');
        $totalPendapatan = (int) $completedPengajuan->sum('total');
        $totalSelesai = $completedPengajuan->count();
        $sedangBerjalan = $allPengajuan->whereNotIn('status', ['Selesai', 'Ditolak', 'Dibatalkan'])->count();

        $stats = [
            'total_pendapatan' => $totalPendapatan,
            'total_selesai' => $totalSelesai,
            'sedang_berjalan' => $sedangBerjalan,
            'total_produk' => $allProduk->count(),
            'produk_disetujui' => $allProduk->where('status', 'Disetujui')->count(),
            'total_layanan' => $allPengajuan->count(),
            'layanan_aktif' => $sedangBerjalan,
        ];

        // Monthly trends from actual requests (last 6 months)
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $monthKey = $monthDate->format('M');
            $yearMonth = $monthDate->format('Y-m');
            $count = $allPengajuan->filter(function ($p) use ($yearMonth) {
                return $p->created_at && $p->created_at->format('Y-m') === $yearMonth;
            })->count();

            $monthlyTrends[] = [
                'month' => $monthKey,
                'count' => $count,
            ];
        }

        // Top 5 services by revenue
        $topLayanan = $completedPengajuan
            ->groupBy('product_id')
            ->map(function ($items) {
                $first = $items->first();

                return [
                    'id' => $first->product_id ?? 0,
                    'name' => $first->product?->name ?? 'Layanan Umum',
                    'category' => $first->product?->category?->name ?? 'Jasa / Produk',
                    'count' => $items->count(),
                    'revenue' => (int) $items->sum('total'),
                ];
            })
            ->sortByDesc('revenue')
            ->take(5)
            ->values();

        $recentProduk = ProdukUnggulan::latest()
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'researcher' => $p->researcher,
                'date' => optional($p->created_at)->format('Y-m-d'),
                'status' => $p->status,
            ]);

        return Inertia::render('Direktur/Dashboard', [
            'stats' => $stats,
            'monthlyTrends' => $monthlyTrends,
            'topLayanan' => $topLayanan,
            'recentProduk' => $recentProduk,
        ]);
    }
}

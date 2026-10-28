<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\ProdukUnggulan;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $all = ProdukUnggulan::all();
        $allPengajuan = Pengajuan::with('product')->get();

        $completed = $allPengajuan->where('status', 'Selesai');
        $totalPendapatan = (int) $completed->sum('total');

        $stats = [
            'menunggu' => $all->where('status', 'Diajukan')->count(),
            'disetujui' => $all->where('status', 'Disetujui')->count(),
            'ditolak' => $all->where('status', 'Ditolak')->count(),
            'total_pengajuan' => $allPengajuan->count(),
            'selesai' => $completed->count(),
            'pendapatan' => $totalPendapatan,
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

        // Top services by count
        $layananTerlaris = $allPengajuan
            ->groupBy('product_id')
            ->map(function ($items) {
                $first = $items->first();

                return [
                    'id' => $first->product_id ?? 0,
                    'name' => $first->product?->name ?? 'Layanan Umum',
                    'count' => $items->count(),
                    'total' => (int) $items->sum('total'),
                ];
            })
            ->sortByDesc('count')
            ->take(5)
            ->values();

        $antrean = ProdukUnggulan::where('status', 'Diajukan')
            ->latest()
            ->limit(10)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'researcher' => $p->researcher,
                'date' => optional($p->created_at)->format('Y-m-d'),
                'status' => $p->status,
            ]);

        return Inertia::render('Pimpinan/Dashboard', [
            'stats' => $stats,
            'antrean' => $antrean,
            'monthlyTrends' => $monthlyTrends,
            'layananTerlaris' => $layananTerlaris,
        ]);
    }
}

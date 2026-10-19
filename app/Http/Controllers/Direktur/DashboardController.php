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

        $stats = [
            'total_produk' => $allProduk->count(),
            'produk_disetujui' => $allProduk->where('status', 'Disetujui')->count(),
            'total_layanan' => Pengajuan::count(),
            'layanan_aktif' => Pengajuan::whereNotIn('status', ['Selesai', 'Ditolak', 'Dibatalkan'])->count(),
        ];

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
            'recentProduk' => $recentProduk,
        ]);
    }
}

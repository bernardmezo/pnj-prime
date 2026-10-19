<?php

namespace App\Http\Controllers\Pimpinan;

use App\Http\Controllers\Controller;
use App\Models\ProdukUnggulan;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $all = ProdukUnggulan::all();

        $stats = [
            'menunggu' => $all->where('status', 'Diajukan')->count(),
            'disetujui' => $all->where('status', 'Disetujui')->count(),
            'ditolak' => $all->where('status', 'Ditolak')->count(),
        ];

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
        ]);
    }
}

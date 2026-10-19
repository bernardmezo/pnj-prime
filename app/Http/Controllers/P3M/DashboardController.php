<?php

namespace App\Http\Controllers\P3M;

use App\Http\Controllers\Controller;
use App\Models\ProdukUnggulan;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $ownerId = Auth::id();

        $all = ProdukUnggulan::where('owner_id', $ownerId)->get();

        $stats = [
            'total' => $all->count(),
            'diproses' => $all->whereNotIn('status', ['Disetujui', 'Ditolak', 'Dibatalkan'])->count(),
            'disetujui' => $all->where('status', 'Disetujui')->count(),
            'ditolak' => $all->whereIn('status', ['Ditolak', 'Dibatalkan'])->count(),
        ];

        $daftar = ProdukUnggulan::where('owner_id', $ownerId)
            ->whereNotIn('status', ['Disetujui', 'Ditolak', 'Dibatalkan'])
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'category' => $p->category,
                'date' => optional($p->created_at)->format('Y-m-d'),
                'status' => $p->status,
            ]);

        return Inertia::render('P3M/Dashboard', [
            'stats' => $stats,
            'daftar' => $daftar,
        ]);
    }
}

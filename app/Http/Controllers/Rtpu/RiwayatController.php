<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use Inertia\Inertia;
use Inertia\Response;

class RiwayatController extends Controller
{
    public function index(): Response
    {
        $rows = Pengajuan::with(['product', 'buyer:id,name'])
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'type' => $p->tipe,
                'layanan' => $p->product?->name ?? ucfirst($p->tipe),
                'customer' => $p->buyer?->name,
                'date' => optional($p->created_at)->format('Y-m-d'),
                'status' => $p->status,
                'history' => $p->history ?? [],
            ]);

        return Inertia::render('Rtpu/Riwayat', ['riwayat' => $rows]);
    }
}

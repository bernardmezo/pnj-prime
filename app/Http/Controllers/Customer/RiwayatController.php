<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class RiwayatController extends Controller
{
    public function index(): Response
    {
        $rows = Pengajuan::with('product')->where('buyer_id', Auth::id())
            ->whereIn('status', Pengajuan::CLOSED)
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'type' => $p->tipe,
                'layanan' => $p->product?->name ?? ucfirst($p->tipe),
                'date' => optional($p->created_at)->format('Y-m-d'),
                'status' => $p->status,
                'history' => $p->history ?? [],
            ]);

        return Inertia::render('Customer/Riwayat', ['riwayat' => $rows]);
    }
}

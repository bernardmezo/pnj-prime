<?php

namespace App\Http\Controllers\Direktur;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Models\ProdukUnggulan;
use Inertia\Inertia;
use Inertia\Response;

class PemantauanController extends Controller
{
    public function monitor(): Response
    {
        $produk = ProdukUnggulan::latest()->get()->map(fn ($p) => [
            'id' => $p->id,
            'code' => $p->code,
            'name' => $p->name,
            'researcher' => $p->researcher,
            'date' => optional($p->created_at)->format('Y-m-d'),
            'status' => $p->status,
        ]);

        $layanan = Pengajuan::with(['product', 'buyer:id,name'])->latest()->get()->map(fn ($p) => [
            'id' => $p->id,
            'code' => $p->code,
            'layanan' => $p->product?->name ?? ucfirst($p->tipe),
            'customer' => $p->buyer?->name,
            'date' => optional($p->created_at)->format('Y-m-d'),
            'status' => $p->status,
        ]);

        return Inertia::render('Direktur/Pemantauan', [
            'produk' => $produk,
            'layanan' => $layanan,
        ]);
    }

    public function riwayat(): Response
    {
        $produk = ProdukUnggulan::latest()->get()->map(fn ($p) => [
            'id' => $p->id,
            'code' => $p->code,
            'name' => $p->name,
            'researcher' => $p->researcher,
            'date' => optional($p->created_at)->format('Y-m-d'),
            'status' => $p->status,
        ]);

        $layanan = Pengajuan::with(['product', 'buyer:id,name'])
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'layanan' => $p->product?->name ?? ucfirst($p->tipe),
                'customer' => $p->customer ?? $p->buyer?->name,
                'date' => optional($p->created_at)->format('Y-m-d'),
                'status' => $p->status,
            ]);

        return Inertia::render('Direktur/Riwayat', [
            'produk' => $produk,
            'layanan' => $layanan,
        ]);
    }
}

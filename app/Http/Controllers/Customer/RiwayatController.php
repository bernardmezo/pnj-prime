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
        $rows = Pengajuan::with(['product', 'latestInvoice'])->where('buyer_id', Auth::id())
            ->whereIn('status', [
                ...Pengajuan::CLOSED,
                'Lunas', 'Diproses', 'Dikirim', 'Dijadwalkan', 'Dikerjakan', 'Hasil Diunggah', 'Berjalan',
            ])
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
                'pickup' => $p->pickupDetails(),
                'invoice_url' => in_array($p->latestInvoice?->status, ['issued', 'paid'], true) ? route('customer.pengajuan.invoice', $p) : null,
                'detail_url' => route('customer.pengajuan.show', $p),
            ]);

        return Inertia::render('Customer/Riwayat', ['riwayat' => $rows]);
    }
}

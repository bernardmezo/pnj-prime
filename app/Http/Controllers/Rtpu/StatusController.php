<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class StatusController extends Controller
{
    public function index(): Response
    {
        $rows = Pengajuan::with(['product.owner:id,name', 'buyer:id,name', 'order:id,pengajuan_id,order_number'])
            /** @phpstan-ignore-next-line */
            ->whereNotIn('status', Pengajuan::CLOSED)
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'order_number' => $p->order?->order_number,
                'owner' => $p->product?->owner?->name,
                'type' => $p->tipe,
                'fulfillment' => $p->metode_pengambilan,
                'pickup_ready' => (bool) ($p->pickupDetails()['ready'] ?? false),
                'layanan' => $p->product?->name ?? ucfirst($p->tipe),
                'customer' => $p->buyer?->name,
                'date' => optional($p->created_at)->format('Y-m-d'),
                'status' => $p->status,
                'history' => $p->history ?? [],
            ]);

        return Inertia::render('Rtpu/StatusLayanan', ['daftar' => $rows]);
    }

    public function update(Request $request, Pengajuan $pengajuan)
    {
        abort(403, 'Halaman Status Layanan hanya untuk monitoring.');
    }
}

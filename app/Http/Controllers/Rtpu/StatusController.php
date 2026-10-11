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
        $rows = Pengajuan::with(['product', 'buyer:id,name'])
            ->whereNotIn('status', ['Selesai', 'Dibatalkan'])
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

        return Inertia::render('Rtpu/StatusLayanan', ['daftar' => $rows]);
    }

    public function update(Request $request, Pengajuan $pengajuan)
    {
        $allowed = Pengajuan::NEXT[$pengajuan->status] ?? [];

        $data = $request->validate([
            'status' => 'required|string|in:'.implode(',', $allowed),
            'catatan' => 'nullable|string|max:1000',
        ]);

        $pengajuan->setStatus($data['status'], $data['catatan'] ?? null, Auth::user()->name);
        $pengajuan->save();

        if ($pengajuan->order) {
            $map = [
                'Diproses' => 'diproses',
                'Selesai' => 'selesai',
                'Dibatalkan' => 'dibatalkan',
                'Menunggu Pembayaran' => 'menunggu_pembayaran',
            ];
            if (isset($map[$data['status']])) {
                $attrs = ['status' => $map[$data['status']]];
                if ($data['status'] === 'Selesai') {
                    $attrs['completed_at'] = now();
                }
                $pengajuan->order->update($attrs);
            }
        }

        return back()->with('success', 'Status diperbarui.');
    }
}

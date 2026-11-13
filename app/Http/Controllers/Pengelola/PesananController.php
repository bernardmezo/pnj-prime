<?php

namespace App\Http\Controllers\Pengelola;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Services\PengajuanWorkflow;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PesananController extends Controller
{
    public function index(Request $request): Response
    {
        $pesanan = Pengajuan::with(['product:id,name,owner_id,thumbnail', 'buyer:id,name,email,phone', 'order'])
            ->whereHas('product', fn ($query) => $query->where('owner_id', $request->user()->id))
            ->whereIn('status', ['Lunas', 'Diproses', 'Selesai'])
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'status' => $p->status,
                'product' => $p->product?->name,
                'thumbnail' => $p->product?->thumbnail,
                'quantity' => $p->jumlah,
                'total' => $p->order?->total ?? $p->total,
                'customer' => $p->buyer?->only(['name', 'email', 'phone']),
                'fulfillment' => $p->metode_pengambilan,
                'notes' => $p->catatan,
                'date' => $p->created_at?->format('d/m/Y H:i'),
            ]);

        return Inertia::render('Pengelola/Pesanan/Index', ['pesanan' => $pesanan]);
    }

    public function update(Request $request, Pengajuan $pengajuan, PengajuanWorkflow $workflow): RedirectResponse
    {
        $data = $request->validate(['status' => 'required|in:Diproses,Selesai']);
        DB::transaction(function () use ($request, $pengajuan, $workflow, $data) {
            $locked = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->product?->owner_id === $request->user()->id, 404);
            $expected = $data['status'] === 'Diproses' ? 'Lunas' : 'Diproses';
            abort_unless($locked->status === $expected, 422, 'Status pesanan tidak sesuai untuk tindakan ini.');
            $workflow->transition($locked, $data['status'], 'Pesanan ditindaklanjuti pemilik produk.', $request->user()->name);
        });

        return back()->with('success', 'Status pesanan berhasil diperbarui.');
    }
}

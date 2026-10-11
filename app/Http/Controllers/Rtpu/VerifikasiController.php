<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentProof;
use App\Models\Pengajuan;
use App\Services\SettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class VerifikasiController extends Controller
{
    public function __construct(private SettingService $settings) {}

    private function serializePengajuan(Pengajuan $p): array
    {
        return [
            'id' => $p->id,
            'code' => $p->code,
            'type' => $p->tipe,
            'layanan' => $p->product?->name ?? ucfirst($p->tipe),
            'customer' => $p->buyer?->name,
            'date' => optional($p->created_at)->format('Y-m-d H:i'),
            'status' => $p->status,
            'qty' => $p->jumlah,
            'need' => $p->keperluan,
            'total' => $p->total,
            'note' => $p->catatan_peninjau,
            'history' => $p->history ?? [],
        ];
    }

    // ---- Verifikasi Pengajuan Layanan ----

    public function layanan(): Response
    {
        $rows = Pengajuan::with(['product', 'buyer:id,name'])
            ->where('status', 'Diajukan')
            ->latest()
            ->get()
            ->map(fn ($p) => $this->serializePengajuan($p));

        return Inertia::render('Rtpu/Verifikasi/Layanan', [
            'antrean' => $rows,
            'selected' => $rows->first(),
        ]);
    }

    public function approveLayanan(Pengajuan $pengajuan)
    {
        abort_unless($pengajuan->status === 'Diajukan', 403);

        $total = $pengajuan->total ?? (int) ($pengajuan->product?->final_price ?? 0);
        $tax = $this->settings->calculateTax($total);
        $pengajuan->total = $total;
        $pengajuan->setStatus('Menunggu Pembayaran', null, Auth::user()->name);
        $pengajuan->save();

        $existing = $pengajuan->order()->where('status', 'menunggu_pembayaran')->first();
        if (! $existing) {
            $pengajuan->order()->create([
                'order_number' => $this->orderNumber($pengajuan),
                'buyer_id' => $pengajuan->buyer_id,
                'subtotal' => $total,
                'tax_amount' => $tax,
                'total' => $total + $tax,
                'status' => 'menunggu_pembayaran',
            ]);
        }

        return back()->with('success', 'Pengajuan diverifikasi, menunggu pembayaran Customer.');
    }

    public function rejectLayanan(Request $request, Pengajuan $pengajuan)
    {
        abort_unless($pengajuan->status === 'Diajukan', 403);

        $request->validate(['catatan' => 'required|string|max:1000']);

        $pengajuan->catatan_peninjau = $request->catatan;
        $pengajuan->setStatus('Ditolak', $request->catatan, Auth::user()->name);
        $pengajuan->save();

        return back()->with('success', 'Pengajuan ditolak dengan catatan.');
    }

    // ---- Verifikasi Pembayaran ----

    public function pembayaran(): Response
    {
        $proofs = PaymentProof::with(['order.buyer:id,name'])
            ->where('verification_status', 'pending')
            ->latest()
            ->get()
            ->map(fn ($pf) => [
                'id' => $pf->id,
                'code' => $pf->order?->order_number,
                'customer' => $pf->order?->buyer?->name,
                'layanan' => 'Tagihan '.$pf->order?->order_number,
                'amount' => $pf->order?->total,
                'method' => $pf->notes,
                'at' => optional($pf->created_at)->format('Y-m-d H:i'),
                'proof' => route('berkas.show', ['kind' => 'bukti', 'id' => $pf->id, 'index' => 0]),
                'status' => 'Menunggu Verifikasi Pembayaran',
            ]);

        return Inertia::render('Rtpu/Verifikasi/Pembayaran', [
            'antrean' => $proofs,
            'selected' => $proofs->first(),
        ]);
    }

    public function acceptBayar(PaymentProof $proof)
    {
        abort_unless($proof->verification_status === 'pending', 403);

        $proof->update([
            'verification_status' => 'verified',
            'verified_by' => Auth::id(),
            'verified_at' => now(),
        ]);

        $order = $proof->order;
        $order->update(['status' => 'diproses', 'confirmed_at' => now()]);

        if ($order->pengajuan_id) {
            $pengajuan = Pengajuan::find($order->pengajuan_id);
            $pengajuan?->setStatus('Diproses', null, Auth::user()->name);
            $pengajuan?->save();
        }

        return back()->with('success', 'Pembayaran diterima, pengajuan diproses.');
    }

    public function rejectBayar(Request $request, PaymentProof $proof)
    {
        abort_unless($proof->verification_status === 'pending', 403);

        $request->validate(['catatan' => 'required|string|max:1000']);

        $proof->update([
            'verification_status' => 'rejected',
            'rejection_reason' => $request->catatan,
            'verified_by' => Auth::id(),
            'verified_at' => now(),
        ]);

        $order = $proof->order;
        $order->update(['status' => 'menunggu_pembayaran']);

        if ($order->pengajuan_id) {
            $pengajuan = Pengajuan::find($order->pengajuan_id);
            if ($pengajuan) {
                $pengajuan->catatan_peninjau = $request->catatan;
                $pengajuan->setStatus('Menunggu Pembayaran', $request->catatan, Auth::user()->name);
                $pengajuan->save();
            }
        }

        return back()->with('success', 'Bukti ditolak, pemohon diminta mengunggah ulang.');
    }

    private function orderNumber(Pengajuan $pengajuan): string
    {
        $base = 'PNJ-'.now()->format('Ymd').'-'.str_pad((string) $pengajuan->id, 4, '0', STR_PAD_LEFT);
        $n = $base;
        $i = 1;
        while (Order::where('order_number', $n)->exists()) {
            $n = $base.'-'.(++$i);
        }

        return $n;
    }
}

<?php

namespace App\Http\Controllers\Rtpu;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentProof;
use App\Models\Pengajuan;
use App\Models\Setting;
use App\Services\PengajuanWorkflow;
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

    public function approveLayanan(Pengajuan $pengajuan, PengajuanWorkflow $workflow)
    {
        abort_unless($pengajuan->status === 'Diajukan', 403);

        $isRental = in_array($pengajuan->tipe, ['ruangan', 'alat'], true);
        $needsPimpinanApproval = $isRental && Setting::where('key', 'sewa_perlu_persetujuan_pimpinan')->value('value') === '1';

        $targetStatus = $needsPimpinanApproval ? 'Menunggu Persetujuan Pimpinan' : 'Menunggu Pembayaran';
        $note = $needsPimpinanApproval
            ? 'Diverifikasi berkas oleh Admin RTPU, diteruskan ke Pimpinan RTPU untuk persetujuan sewa.'
            : 'Diverifikasi oleh Admin RTPU, menunggu pembayaran Customer.';

        $workflow->transition($pengajuan, $targetStatus, $note, Auth::user()->name);

        $msg = $needsPimpinanApproval
            ? 'Pengajuan sewa diteruskan ke Pimpinan RTPU.'
            : 'Pengajuan diverifikasi, menunggu pembayaran Customer.';

        return back()->with('success', $msg);
    }

    public function rejectLayanan(Request $request, Pengajuan $pengajuan, PengajuanWorkflow $workflow)
    {
        abort_unless($pengajuan->status === 'Diajukan', 403);

        $request->validate(['catatan' => 'required|string|max:1000']);

        $workflow->transition($pengajuan, 'Ditolak', $request->catatan, Auth::user()->name);

        return back()->with('success', 'Pengajuan ditolak dengan catatan.');
    }

    // ---- Verifikasi Pembayaran ----

    public function pembayaran(): Response
    {
        // 1. Online Midtrans Payments
        $payments = Payment::with(['request.buyer:id,name', 'request.product:id,name'])
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => 'midtrans-'.$p->id,
                'db_id' => $p->id,
                'is_midtrans' => true,
                'order_id' => $p->order_id,
                'code' => $p->request?->code ?? $p->order_id,
                'request_id' => $p->request_id,
                'customer' => $p->request?->buyer?->name ?? 'Customer',
                'layanan' => $p->request?->product?->name ?? 'Layanan Pengajuan',
                'amount' => $p->gross_amount,
                'method' => $p->payment_type ? strtoupper(str_replace('_', ' ', $p->payment_type)) : 'Midtrans',
                'status' => $p->status === 'paid' ? 'Lunas' : ($p->status === 'pending' ? 'Menunggu Pembayaran' : ucfirst($p->status)),
                'raw_status' => $p->status,
                'paid_at' => optional($p->paid_at)->format('Y-m-d H:i') ?? '-',
                'at' => optional($p->created_at)->format('Y-m-d H:i'),
                'request_url' => $p->request_id ? route('customer.pengajuan.show', $p->request_id) : null,
            ]);

        // 2. Legacy Manual Proofs (for compatibility and audit)
        $proofs = PaymentProof::with(['order.buyer:id,name'])
            ->latest()
            ->get()
            ->map(fn ($pf) => [
                'id' => (string) $pf->id,
                'db_id' => $pf->id,
                'is_midtrans' => false,
                'order_id' => $pf->order?->order_number,
                'code' => $pf->order?->order_number,
                'request_id' => $pf->order?->pengajuan_id,
                'customer' => $pf->order?->buyer?->name,
                'layanan' => 'Tagihan '.$pf->order?->order_number,
                'amount' => $pf->order?->total,
                'method' => $pf->notes ?? 'Manual Transfer',
                'at' => optional($pf->created_at)->format('Y-m-d H:i'),
                'paid_at' => optional($pf->verified_at)->format('Y-m-d H:i') ?? '-',
                'proof' => route('berkas.show', ['kind' => 'bukti', 'id' => $pf->id, 'index' => 0]),
                'status' => $pf->verification_status === 'verified' ? 'Lunas' : ($pf->verification_status === 'pending' ? 'Menunggu Verifikasi Pembayaran' : 'Ditolak'),
                'raw_status' => $pf->verification_status,
                'can_verify' => $pf->verification_status === 'pending',
                'request_url' => $pf->order?->pengajuan_id ? route('customer.pengajuan.show', $pf->order->pengajuan_id) : null,
            ]);

        $combined = $payments->concat($proofs);

        return Inertia::render('Rtpu/Verifikasi/Pembayaran', [
            'antrean' => $combined,
            'selected' => $combined->first(),
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
        $order->update(['status' => 'lunas', 'confirmed_at' => now()]);

        if ($order->pengajuan_id) {
            $pengajuan = Pengajuan::find($order->pengajuan_id);
            $pengajuan?->setStatus('Lunas', 'Pembayaran diverifikasi oleh Admin RTPU.', Auth::user()->name);
            $pengajuan?->save();

            $pengajuan?->latestInvoice?->update(['status' => 'paid']);
        }

        return back()->with('success', 'Pembayaran diverifikasi dan dinyatakan Lunas.');
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

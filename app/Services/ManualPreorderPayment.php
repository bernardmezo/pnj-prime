<?php

namespace App\Services;

use App\Models\PaymentProof;
use App\Models\Pengajuan;
use App\Models\User;
use App\Notifications\ProductPaymentReceived;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class ManualPreorderPayment
{
    public function upload(Pengajuan $request, User $buyer, int $bankId, UploadedFile $file): void
    {
        $path = null;
        try {
            DB::transaction(function () use ($request, $buyer, $bankId, $file, &$path) {
                $request = Pengajuan::whereKey($request->id)->lockForUpdate()->firstOrFail();
                abort_unless($request->buyer_id === $buyer->id, 403);
                abort_unless($request->status === 'Menunggu Pembayaran' && $request->isPreorder(), 422);
                $invoice = $request->invoices()->where('status', 'issued')->lockForUpdate()->first();
                if (! $invoice || ! $invoice->bank_snapshot || (int) $invoice->bank_snapshot['id'] !== $bankId || $invoice->due_at->isPast()
                    || $request->order?->id !== $invoice->order_id || (int) $request->order->total !== $invoice->total) {
                    throw ValidationException::withMessages(['metode_id' => 'Bukti harus sesuai rekening BLU dan invoice aktif yang belum jatuh tempo. Hubungi RTPU.']);
                }
                $path = $file->store('bukti', 'local');
                PaymentProof::create(['order_id' => $invoice->order_id, 'file_path' => $path,
                    'file_name' => $file->getClientOriginalName(), 'mime_type' => $file->getMimeType(),
                    'notes' => 'BLU invoice '.$invoice->id.'; bank '.$bankId, 'verification_status' => 'pending']);
                $request->setStatus('Menunggu Verifikasi Pembayaran', 'Bukti transfer BLU diunggah.', $buyer->name);
                $request->save();
                $request->order->update(['status' => 'menunggu_verifikasi']);
            });
        } catch (\Throwable $exception) {
            if ($path) {
                Storage::disk('local')->delete($path);
            }
            throw $exception;
        }
    }

    public function verify(PaymentProof $proof, User $actor, ?string $rejection = null): void
    {
        abort_unless(in_array($actor->role, ['admin_rtpu', 'super_admin'], true), 403);
        DB::transaction(function () use ($proof, $actor, $rejection) {
            $request = Pengajuan::whereKey($proof->order->pengajuan_id)->lockForUpdate()->firstOrFail();
            $proof = PaymentProof::whereKey($proof->id)->lockForUpdate()->firstOrFail();
            $invoice = $request->invoices()->where('status', 'issued')->lockForUpdate()->first();
            abort_unless($proof->verification_status === 'pending' && $request->status === 'Menunggu Verifikasi Pembayaran', 422);
            abort_unless($invoice && $invoice->bank_snapshot && $invoice->order_id === $proof->order_id
                && $proof->notes === 'BLU invoice '.$invoice->id.'; bank '.$invoice->bank_snapshot['id']
                && $invoice->total === (int) $proof->order->total, 422);
            $proof->update(['verification_status' => $rejection === null ? 'verified' : 'rejected',
                'verified_by' => $actor->id, 'verified_at' => now(), 'rejection_reason' => $rejection]);
            $request->setStatus($rejection === null ? 'Lunas' : 'Menunggu Pembayaran', $rejection ?? 'Transfer BLU diverifikasi RTPU.', $actor->name);
            $request->save();
            $request->order->update(['status' => $rejection === null ? 'lunas' : 'menunggu_pembayaran', 'confirmed_at' => $rejection === null ? now() : null]);
            if ($rejection === null) {
                $invoice->update(['status' => 'paid']);
                $request->loadMissing('product.owner');
                $request->product?->owner?->notify((new ProductPaymentReceived($request))->afterCommit());
            }
        });
    }
}

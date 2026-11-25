<?php

namespace App\Services;

use App\Models\Pengajuan;
use App\Notifications\ProductPaymentReceived;
use App\Notifications\CustomerPaymentConfirmed;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConfirmPaidPengajuan
{
    public function handle(Pengajuan $pengajuan): void
    {
        DB::transaction(function () use ($pengajuan) {
            $locked = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
            // A confirmed, persisted legacy gateway payment remains valid even if
            // the product is now on the manual-payment path.
            if (! $locked->payments()->where('status', 'paid')->exists()) {
                throw ValidationException::withMessages(['payment' => 'Pembayaran Midtrans belum dikonfirmasi.']);
            }
            if (in_array($locked->status, ['Lunas', 'Diproses', 'Dikirim', 'Selesai', 'Dibatalkan', 'Ditolak', 'Terjadwal', 'Berjalan', 'Dipinjam', 'Dikembalikan', 'Dijadwalkan', 'Dikerjakan', 'Hasil Diunggah'], true)) {
                return;
            }
            // Cegah pembayaran ganda: bukti transfer manual sedang diverifikasi atau invoice sudah lunas.
            if ($locked->status === 'Menunggu Verifikasi Pembayaran' || $locked->invoices()->where('status', 'paid')->exists()) {
                return;
            }

            $locked->setStatus('Lunas', 'Pembayaran dikonfirmasi Midtrans; pesanan siap disiapkan pemilik produk.', 'Midtrans Gateway');
            $locked->save();
            $locked->order?->update(['status' => 'lunas', 'confirmed_at' => now()]);
            $invoice = $locked->latestInvoice;
            if ($invoice && ! $invoice->bank_snapshot) {
                $invoice->update(['status' => 'paid']);
            }
            $locked->loadMissing('product.owner');
            // Notify product owner (existing behavior)
            $locked->product?->owner?->notify((new ProductPaymentReceived($locked))->afterCommit());
            // Notify customer about payment confirmation (C2.4/C3.4 gap)
            $locked->buyer?->notify((new CustomerPaymentConfirmed($locked))->afterCommit());
        });
    }
}

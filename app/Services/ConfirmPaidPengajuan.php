<?php

namespace App\Services;

use App\Models\Pengajuan;
use App\Notifications\ProductPaymentReceived;
use Illuminate\Support\Facades\DB;

class ConfirmPaidPengajuan
{
    public function handle(Pengajuan $pengajuan): void
    {
        DB::transaction(function () use ($pengajuan) {
            $locked = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
            if (in_array($locked->status, ['Lunas', 'Diproses', 'Selesai', 'Dibatalkan', 'Ditolak'], true)) {
                return;
            }

            $locked->setStatus('Lunas', 'Pembayaran dikonfirmasi Midtrans; pesanan siap disiapkan pemilik produk.', 'Midtrans Gateway');
            $locked->save();
            $locked->order?->update(['status' => 'lunas', 'confirmed_at' => now()]);
            $locked->latestInvoice?->update(['status' => 'paid']);
            $locked->loadMissing('product.owner');
            $locked->product?->owner?->notify(new ProductPaymentReceived($locked));
        });
    }
}

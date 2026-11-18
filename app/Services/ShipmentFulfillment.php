<?php

namespace App\Services;

use App\Models\Pengajuan;
use App\Notifications\OrderShipped;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Pemenuhan produk yang dikirim via ekspedisi (Jalur B/A, metode "Diantar").
 * Alur: Lunas -> Diproses ("Mulai Proses") -> Dikirim (nama kurir + no. resi) -> Selesai.
 */
class ShipmentFulfillment
{
    public function handle(Pengajuan $p, Request $request, PengajuanWorkflow $workflow): void
    {
        $status = $request->input('status');

        if ($status === 'Diproses') {
            if ($p->status !== 'Lunas') {
                throw ValidationException::withMessages(['status' => 'Pesanan telah berubah. Muat ulang halaman.']);
            }
            $workflow->transition($p, 'Diproses', 'Pesanan sedang disiapkan pemilik produk.', $request->user()->name);

            return;
        }

        if ($status === 'Dikirim') {
            $data = $request->validate([
                'courier_name' => 'required|string|max:100',
                'tracking_number' => 'required|string|max:100|regex:/^[A-Za-z0-9\-\/\. ]+$/',
            ], [
                'courier_name.required' => 'Nama kurir wajib diisi.',
                'tracking_number.required' => 'Nomor resi wajib diisi.',
                'tracking_number.regex' => 'Nomor resi hanya boleh berisi huruf, angka, spasi, titik, tanda hubung, dan garis miring.',
            ]);

            if ($p->status !== 'Diproses') {
                throw ValidationException::withMessages(['status' => 'Mulai proses pesanan sebelum mengirim. Muat ulang halaman.']);
            }

            // Guard atomik: hanya satu request yang boleh mengubah Diproses -> Dikirim.
            $changed = Pengajuan::whereKey($p->id)->where('status', 'Diproses')->whereNull('shipped_at')->update([
                'courier_name' => trim($data['courier_name']),
                'tracking_number' => trim($data['tracking_number']),
                'shipped_at' => now(),
                'shipped_by' => $request->user()->id,
            ]);
            if (! $changed) {
                throw ValidationException::withMessages(['status' => 'Pesanan telah berubah. Muat ulang halaman.']);
            }

            $p->refresh();
            $workflow->transition(
                $p,
                'Dikirim',
                'Dikirim via '.$p->courier_name.', no. resi '.$p->tracking_number.'.',
                $request->user()->name,
            );
            $p->buyer?->notify(new OrderShipped($p));

            return;
        }

        if ($status === 'Selesai') {
            if ($p->status !== 'Dikirim') {
                throw ValidationException::withMessages(['status' => 'Pesanan harus berstatus Dikirim sebelum diselesaikan.']);
            }
            $workflow->transition($p, 'Selesai', 'Pesanan diterima customer.', $request->user()->name);

            return;
        }

        throw ValidationException::withMessages(['status' => 'Tindakan tidak dikenali.']);
    }
}

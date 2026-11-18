<?php

namespace App\Services;

use App\Models\Pengajuan;
use App\Notifications\PickupReady;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PickupFulfillment
{
    public function handle(Pengajuan $p, Request $request, PengajuanWorkflow $workflow): void
    {
        if ($request->input('status') === 'Diproses') {
            $request->validate(['pickup_action' => 'required|in:ready']);
            if (! in_array($p->status, ['Lunas', 'Diproses'], true) || $p->pickup_ready_at) {
                throw ValidationException::withMessages(['status' => 'Pesanan telah berubah atau sudah siap diambil. Muat ulang halaman.']);
            }
            $changed = Pengajuan::whereKey($p->id)->where('status', $p->status)->whereNull('pickup_ready_at')->update(['pickup_ready_at' => now(), 'pickup_ready_by' => $request->user()->id]);
            if (! $changed) {
                throw ValidationException::withMessages(['status' => 'Pesanan telah berubah. Muat ulang halaman.']);
            }
            $p->refresh();
            if ($p->status === 'Lunas') {
                $workflow->transition($p, 'Diproses', 'Barang siap diambil di PNJ, pukul 08.00–16.00 WIB.', $request->user()->name);
            }
            $p->refresh();
            $p->pushHistory('Siap Diambil', 'Barang siap diambil di PNJ, pukul 08.00–16.00 WIB.', $request->user()->name);
            $p->save();
            $p->buyer->notify(new PickupReady($p));

            return;
        }
        $data = $request->validate(['collector_name' => 'required|string|max:150', 'collector_contact' => 'required|string|max:100', 'handover_photo' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120']);
        if ($p->status !== 'Diproses' || ! $p->pickup_ready_at || $p->handed_over_at) {
            throw ValidationException::withMessages(['status' => 'Tandai barang siap diambil sebelum serah terima. Pesanan selesai tidak dapat diubah.']);
        }
        $path = $request->file('handover_photo')->store('pickup-handover', 'local');
        if (! $path) {
            throw ValidationException::withMessages(['handover_photo' => 'Foto gagal disimpan. Unggah ulang.']);
        }
        try {
            $changed = Pengajuan::whereKey($p->id)->where('status', 'Diproses')->whereNull('handed_over_at')->whereNotNull('pickup_ready_at')->update(['collector_name' => $data['collector_name'], 'collector_contact' => $data['collector_contact'], 'handover_photo_path' => $path, 'handed_over_at' => now(), 'handed_over_by' => $request->user()->id]);
            if (! $changed) {
                throw ValidationException::withMessages(['status' => 'Pesanan telah berubah. Muat ulang halaman.']);
            }
            $p->refresh();
            $workflow->transition($p, 'Selesai', 'Barang diserahterimakan; identitas pengambil dan foto tersimpan privat.', $request->user()->name);
        } catch (\Throwable $e) {
            Storage::disk('local')->delete($path);
            throw $e;
        }
    }
}

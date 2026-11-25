<?php

namespace App\Http\Controllers\Pengelola;

use App\Http\Controllers\Controller;
use App\Models\Pengajuan;
use App\Services\JasaFulfillment;
use App\Services\PengajuanWorkflow;
use App\Services\PickupFulfillment;
use App\Services\ShipmentFulfillment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PesananController extends Controller
{
    public function index(Request $request): Response
    {
        $pesanan = Pengajuan::with(['product' => fn ($query) => $query->withTrashed()->select('id', 'name', 'owner_id', 'thumbnail'), 'buyer:id,name,email,phone', 'order'])
            ->whereHas('product', fn ($query) => $query->withTrashed()->where('owner_id', $request->user()->id))
            ->whereIn('status', ['Lunas', 'Diproses', 'Dikirim', 'Dijadwalkan', 'Dikerjakan', 'Hasil Diunggah', 'Terjadwal', 'Berjalan', 'Dipinjam', 'Dikembalikan', 'Selesai'])
            ->latest()
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'code' => $p->code,
                'status' => $p->status,
                'tipe' => $p->tipe,
                'pickup' => $p->pickupDetails(),
                'product' => $p->product?->name,
                'thumbnail' => $p->product?->thumbnail,
                'quantity' => $p->jumlah,
                'total' => $p->order?->total ?? $p->total,
                'customer' => $p->buyer?->only(['name', 'email', 'phone']),
                'fulfillment' => $p->metode_pengambilan,
                'notes' => $p->catatan,
                'date' => $p->created_at?->format('d/m/Y H:i'),
                'is_rental' => $p->isRental(),
                'shipment' => $p->shipmentDetails(),
                'jasa' => $p->jasaDetails(),
                'kebutuhan_detail' => $p->isJasaWork() ? $p->kebutuhan_detail : null,
                'rental_start' => $p->rental_start?->format('d/m/Y H:i'),
                'rental_end' => $p->rental_end?->format('d/m/Y H:i'),
                'rental_started_at' => $p->rental_started_at?->format('d/m/Y H:i'),
                'rental_returned_at' => $p->rental_returned_at?->format('d/m/Y H:i'),
                'renter_data' => $p->renter_data,
                'rental_duration_label' => $p->rentalDurationLabel(),
            ]);

        return Inertia::render('Pengelola/Pesanan/Index', [
            'pesanan' => $pesanan,
            'pesananRoute' => $request->routeIs('rtpu.*') ? 'rtpu.pesanan.update' : 'pengelola.pesanan.update',
            'ownerLabel' => $request->routeIs('rtpu.*') ? 'Admin RTPU' : 'Admin Pengelola',
        ]);
    }

    public function update(Request $request, Pengajuan $pengajuan, PengajuanWorkflow $workflow): RedirectResponse
    {
        $data = $request->validate([
            'status' => 'required|in:Diproses,Dikirim,Terjadwal,Berjalan,Dipinjam,Dikembalikan,Selesai,Dijadwalkan,Dikerjakan,Hasil Diunggah,Perkiraan Selesai',
        ]);

        DB::transaction(function () use ($request, $pengajuan, $workflow, $data) {
            $locked = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->product()->withTrashed()->where('owner_id', $request->user()->id)->exists(), 404);

            if ($locked->isRental()) {
                abort(422, 'Status sewa berjalan otomatis sesuai jadwal dan selesai otomatis setelah jadwal berakhir.');
            }

            if ($locked->isJasaWork()) {
                app(JasaFulfillment::class)->handle($locked, $request, $workflow);
                return;
            }

            if ($locked->isPickup()) {
                app(PickupFulfillment::class)->handle($locked, $request, $workflow);
                return;
            }

            if ($locked->isShipment()) {
                app(ShipmentFulfillment::class)->handle($locked, $request, $workflow);
                return;
            }

            $expected = $data['status'] === 'Diproses' ? 'Lunas' : 'Diproses';
            abort_unless($locked->status === $expected, 422, 'Status pesanan tidak sesuai untuk tindakan ini.');
            $workflow->transition($locked, $data['status'], 'Pesanan ditindaklanjuti pemilik produk.', $request->user()->name);
        });

        return back()->with('success', 'Status pesanan berhasil diperbarui.');
    }

}

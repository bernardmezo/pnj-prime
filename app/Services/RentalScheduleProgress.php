<?php

namespace App\Services;

use App\Models\Pengajuan;
use Illuminate\Support\Facades\DB;

class RentalScheduleProgress
{
    public function advance(): void
    {
        $now = now();
        $bookings = Pengajuan::query()
            ->whereIn('status', ['Lunas', 'Berjalan'])
            ->where('reschedule_required', false)
            ->whereNotNull('rental_start')
            ->whereNotNull('rental_end')
            ->where('rental_start', '<=', $now)
            ->get(['id']);

        foreach ($bookings as $booking) {
            DB::transaction(function () use ($booking, $now) {
                $pengajuan = Pengajuan::whereKey($booking->id)->lockForUpdate()->first();
                if (! $pengajuan || $pengajuan->reschedule_required || ! $pengajuan->isRental() || ! $pengajuan->rental_end) {
                    return;
                }

                if ($pengajuan->status === 'Lunas' && $pengajuan->rental_start->lessThanOrEqualTo($now) && $pengajuan->rental_end->greaterThan($now)) {
                    $pengajuan->update(['rental_started_at' => $now]);
                    app(PengajuanWorkflow::class)->transition($pengajuan, 'Berjalan', 'Masa sewa dimulai otomatis sesuai jadwal.', 'Sistem');
                    $pengajuan->refresh();
                }

                $this->complete($pengajuan, $now);
            });
        }
    }

    private function complete(Pengajuan $pengajuan, $now): void
    {
        if ($pengajuan->status !== 'Berjalan' || $pengajuan->rental_end->greaterThan($now)) {
            return;
        }

        $pengajuan->update(['rental_returned_at' => $now]);
        app(PengajuanWorkflow::class)->transition($pengajuan, 'Selesai', 'Sewa selesai otomatis setelah jadwal berakhir.', 'Sistem');
        app(RoomBookingService::class)->releaseForPengajuan($pengajuan->id);
    }
}

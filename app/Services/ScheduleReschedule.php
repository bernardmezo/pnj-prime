<?php

namespace App\Services;

use App\Models\Pengajuan;
use App\Notifications\ScheduleRescheduleRequired;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ScheduleReschedule
{
    public function customerReschedule(Pengajuan $pengajuan, string $start, string $end): void
    {
        $startAt = \Illuminate\Support\Carbon::parse($start);
        $endAt = \Illuminate\Support\Carbon::parse($end);

        DB::transaction(function () use ($pengajuan, $startAt, $endAt) {
            $locked = Pengajuan::whereKey($pengajuan->id)->lockForUpdate()->firstOrFail();
            abort_unless(in_array($locked->tipe, ['ruangan', 'alat', 'jasa'], true), 422);
            abort_if(in_array($locked->status, ['Selesai', 'Ditolak', 'Dibatalkan', 'Kedaluwarsa'], true), 422);
            if (! $locked->reschedule_required) {
                throw ValidationException::withMessages(['jadwal' => 'Jadwal sudah diperbarui. Muat ulang halaman.']);
            }
            $product = \App\Models\Product::whereKey($locked->product_id)->lockForUpdate()->firstOrFail();
            ServiceAvailability::assertAvailable($product, $startAt, $endAt, $locked->id);

            app(RoomBookingService::class)->releaseForPengajuan($locked->id);
            $locked->reschedule_required = false;
            $locked->reschedule_reason = null;
            $locked->reschedule_requested_at = null;
            $locked->reminder_sent_at = null;
            if ($locked->isRental()) {
                $locked->rental_start = $startAt;
                $locked->rental_end = $endAt;
                app(RoomBookingService::class)->reserve($locked->product_id, $locked->id, $startAt, $endAt);
            } else {
                $locked->jadwal_mulai = $startAt;
                $locked->jadwal_selesai = $endAt;
            }
            $locked->pushHistory($locked->status, 'Customer memilih jadwal pengganti setelah tanggal akademik tidak tersedia.', $locked->buyer?->name);
            $locked->save();
        });
    }
}

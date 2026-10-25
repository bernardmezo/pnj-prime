<?php

namespace App\Services;

use App\Models\RoomBooking;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class RoomBookingService
{
    /**
     * Reserve a room/equipment slot. Catches PostgreSQL GiST exclusion conflict (23P01).
     *
     * @throws ValidationException
     */
    public function reserve(int $productId, int $pengajuanId, Carbon|string $startsAt, Carbon|string $endsAt): RoomBooking
    {
        $start = Carbon::parse($startsAt);
        $end = Carbon::parse($endsAt);

        if ($end->lte($start)) {
            throw ValidationException::withMessages([
                'jam_selesai' => 'Waktu selesai harus setelah waktu mulai.',
            ]);
        }

        // Application-level overlap check (guarantees consistency across both SQLite and PostgreSQL)
        $hasOverlap = RoomBooking::where('product_id', $productId)
            ->where('status', 'ACTIVE')
            ->whereNull('released_at')
            ->where(function ($q) use ($start, $end) {
                $q->where('starts_at', '<', $end)
                    ->where('ends_at', '>', $start);
            })
            ->exists();

        if ($hasOverlap) {
            throw ValidationException::withMessages([
                'tanggal' => 'Jadwal bentrok dengan pengajuan lain untuk ruangan/alat yang sama.',
            ]);
        }

        try {
            return RoomBooking::create([
                'product_id' => $productId,
                'pengajuan_id' => $pengajuanId,
                'starts_at' => $start,
                'ends_at' => $end,
                'status' => 'ACTIVE',
            ]);
        } catch (QueryException $e) {
            // PostgreSQL exclusion constraint violation error code 23P01
            if ($e->getCode() === '23P01' || str_contains($e->getMessage(), 'room_bookings_no_overlap')) {
                throw ValidationException::withMessages([
                    'tanggal' => 'Jadwal bentrok dengan pengajuan lain untuk ruangan/alat yang sama.',
                ]);
            }

            throw $e;
        }
    }

    /**
     * Release any active reservation for a pengajuan.
     */
    public function releaseForPengajuan(int $pengajuanId): int
    {
        return RoomBooking::where('pengajuan_id', $pengajuanId)
            ->where('status', 'ACTIVE')
            ->update([
                'status' => 'RELEASED',
                'released_at' => now(),
            ]);
    }
}

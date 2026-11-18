<?php

namespace App\Services;

use App\Models\RoomBooking;
use Illuminate\Database\QueryException;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
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

        // Lock product row to serialize concurrent reservations for the same product.
        // On SQLite (dev/test) this is a no-op; on PostgreSQL it holds the row lock
        // until the enclosing transaction commits, preventing race conditions.
        if (DB::getDriverName() === 'pgsql') {
            DB::table('products')->where('id', $productId)->lockForUpdate()->first();
        }

        // Application-level overlap check
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

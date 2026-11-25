<?php

namespace App\Services;

use App\Models\AcademicCalendarDate;
use App\Models\Pengajuan;
use App\Models\Product;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;

class ServiceAvailability
{
    public static function operationalDays(Product $product): array
    {
        return array_values(array_map('intval', $product->meta['operational_days'] ?? [1, 2, 3, 4, 5]));
    }

    public static function operationalHours(Product $product): array
    {
        return [
            $product->meta['operational_start'] ?? '08:00',
            $product->meta['operational_end'] ?? '16:00',
        ];
    }

    public static function closedDates(Carbon $start, Carbon $end)
    {
        return AcademicCalendarDate::where('type', 'academic_closed')
            ->whereDate('date', '>=', $start->toDateString())
            ->whereDate('date', '<=', $end->toDateString())
            ->orderBy('date')
            ->get();
    }

    public static function assertAvailable(Product $product, Carbon $start, Carbon $end, ?int $ignorePengajuanId = null): void
    {
        if (! in_array($product->layananTipe(), ['ruangan', 'alat', 'jasa'], true)) {
            return;
        }

        if ($end->lte($start)) {
            throw ValidationException::withMessages(['jadwal' => 'Waktu selesai harus setelah waktu mulai.']);
        }

        if ($start->lt(now())) {
            throw ValidationException::withMessages(['jadwal' => 'Jadwal tidak boleh di masa lalu.']);
        }

        for ($day = $start->copy()->startOfDay(); $day->lte($end->copy()->startOfDay()); $day->addDay()) {
            if (! in_array($day->dayOfWeekIso, self::operationalDays($product), true)) {
                throw ValidationException::withMessages(['jadwal' => 'Tanggal yang dipilih berada di luar hari operasional layanan.']);
            }
        }

        [$open, $close] = self::operationalHours($product);
        if ($start->format('H:i:s') < $open || $start->format('H:i:s') > $close.':00'
            || $end->format('H:i:s') < $open || $end->format('H:i:s') > $close.':00') {
            throw ValidationException::withMessages(['jadwal' => "Jam layanan hanya tersedia pukul {$open}–{$close}."]);
        }

        $closed = self::closedDates($start->copy()->startOfDay(), $end->copy()->startOfDay())->first();
        if ($closed) {
            throw ValidationException::withMessages([
                'jadwal' => "Tanggal {$closed->date->format('d/m/Y')} tidak tersedia: {$closed->title}. Pilih tanggal lain.",
            ]);
        }

        if ($product->layananTipe() === 'ruangan') {
            $conflict = Pengajuan::where('product_id', $product->id)
                ->whereNotNull('rental_start')->whereNotNull('rental_end')
                ->whereNotIn('status', ['Ditolak', 'Dibatalkan', 'Kedaluwarsa'])
                ->where('reschedule_required', false)
                ->when($ignorePengajuanId, fn ($q) => $q->whereKeyNot($ignorePengajuanId))
                ->where('rental_start', '<', $end)
                ->where('rental_end', '>', $start)
                ->exists();
            if ($conflict) {
                throw ValidationException::withMessages(['jadwal' => 'Jadwal bentrok dengan pemesanan lain. Pilih periode lain.']);
            }
        }
    }
}

<?php

namespace App\Services;

use App\Models\Pengajuan;
use App\Notifications\JasaWorkDue;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class JasaScheduleProgress
{
    public function advance(): void
    {
        $now = now();
        Pengajuan::query()->where('tipe', 'jasa')
            ->where('jasa_auto_start', true)
            ->whereIn('status', ['Lunas', 'Diproses', 'Dijadwalkan'])
            ->where('reschedule_required', false)
            ->where('jadwal_mulai', '<=', $now)->lazyById()->each(function ($candidate) use ($now) {
                DB::transaction(function () use ($candidate, $now) {
                    $p = Pengajuan::whereKey($candidate->id)->lockForUpdate()->first();
                    if (! $p || $p->tipe !== 'jasa' || ! $p->jasa_auto_start || $p->reschedule_required || ! in_array($p->status, ['Lunas', 'Diproses', 'Dijadwalkan'], true)) {
                        return;
                    }
                    $start = $p->jadwal_mulai;
                    if (! $start || $start->greaterThan($now)) {
                        return;
                    }
                    $owner = $p->product?->owner;
                    if (! $owner) {
                        Log::warning('Jasa tidak dimulai otomatis: pemilik produk tidak tersedia.', ['pengajuan_id' => $p->id]);
                        return;
                    }
                    app(PengajuanWorkflow::class)->transition($p, 'Dikerjakan', 'Pengerjaan dimulai otomatis sesuai jadwal.', 'Sistem');
                    $owner->notify(new JasaWorkDue($p));
                });
            });
    }
}

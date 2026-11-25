<?php

namespace App\Console\Commands;

use App\Models\Pengajuan;
use App\Notifications\ScheduleReminder;
use Illuminate\Console\Command;

class SendScheduleReminders extends Command
{
    protected $signature = 'pengajuan:send-schedule-reminders';

    protected $description = 'Kirim reminder H-1 jadwal sewa dan jasa kepada customer dan pengelola.';

    public function handle(): int
    {
        $tomorrow = now()->addDay()->toDateString();
        $bookings = Pengajuan::with(['buyer', 'product.owner'])
            ->where('reschedule_required', false)
            ->whereNull('reminder_sent_at')
            ->whereNotIn('status', ['Selesai', 'Ditolak', 'Dibatalkan', 'Kedaluwarsa'])
            ->where(function ($query) use ($tomorrow) {
                $query->whereDate('rental_start', $tomorrow)
                    ->orWhereDate('jadwal_mulai', $tomorrow);
            })
            ->get();

        $sent = 0;
        $missing = 0;
        foreach ($bookings as $pengajuan) {
            if (! $pengajuan->buyer || ! $pengajuan->product?->owner) {
                $this->warn("Reminder {$pengajuan->code} dilewati: customer atau pengelola tidak tersedia.");
                $missing++;
                continue;
            }

            $pengajuan->buyer->notify(new ScheduleReminder($pengajuan));
            $pengajuan->product->owner->notify(new ScheduleReminder($pengajuan, 'owner'));
            $pengajuan->update(['reminder_sent_at' => now()]);
            $sent++;
        }

        $this->info("Reminder dijadwalkan untuk {$sent} jadwal; {$missing} dilewati.");

        return $missing ? self::FAILURE : self::SUCCESS;
    }
}

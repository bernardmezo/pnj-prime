<?php

namespace App\Console\Commands;

use App\Models\Pengajuan;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ExpireUnpaidPengajuan extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pengajuan:expire-unpaid {--hours=72 : Batas waktu pembayaran dalam jam}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Batalkan pengajuan yang belum dibayar setelah melewati batas waktu (default 72 jam)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $cutoff = Carbon::now()->subHours($hours);

        $expired = Pengajuan::query()
            ->where('status', 'Menunggu Pembayaran')
            ->where('updated_at', '<=', $cutoff)
            ->get();

        $count = 0;
        foreach ($expired as $item) {
            $item->pushHistory(
                'Dibatalkan',
                "Kedaluwarsa otomatis: batas waktu pembayaran ({$hours} jam) terlampaui.",
                'Sistem'
            );
            $item->status = 'Dibatalkan';
            $item->save();
            $count++;
        }

        $this->info("Berhasil membatalkan {$count} pengajuan kedaluwarsa.");

        return self::SUCCESS;
    }
}

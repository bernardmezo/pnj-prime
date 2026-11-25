<?php

namespace App\Console\Commands;

use App\Services\RentalScheduleProgress;
use Illuminate\Console\Command;

class AdvanceRentals extends Command
{
    protected $signature = 'pengajuan:advance-rentals';

    protected $description = 'Mulai dan selesaikan sewa lunas secara otomatis sesuai jadwal.';

    public function handle(RentalScheduleProgress $progress): int
    {
        $progress->advance();

        return self::SUCCESS;
    }
}

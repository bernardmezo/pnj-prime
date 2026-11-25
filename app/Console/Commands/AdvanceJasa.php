<?php

namespace App\Console\Commands;

use App\Services\JasaScheduleProgress;
use Illuminate\Console\Command;

class AdvanceJasa extends Command
{
    protected $signature = 'pengajuan:advance-jasa';

    protected $description = 'Mulai pengerjaan jasa lunas sesuai jadwal customer.';

    public function handle(JasaScheduleProgress $progress): int
    {
        $progress->advance();

        return self::SUCCESS;
    }
}

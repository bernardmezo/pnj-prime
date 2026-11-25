<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// WP-1.11: Scheduled tasks
Schedule::command('pengajuan:expire-unpaid --hours=72')->hourly();
Schedule::command('pengajuan:send-schedule-reminders')->dailyAt('08:00')->withoutOverlapping();
Schedule::command('pengajuan:advance-rentals')->everyMinute()->withoutOverlapping();
Schedule::command('pengajuan:advance-jasa')->everyMinute()->withoutOverlapping();

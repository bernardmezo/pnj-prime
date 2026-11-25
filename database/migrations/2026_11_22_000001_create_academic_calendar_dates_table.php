<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_calendar_dates', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->string('title');
            $table->string('type')->default('academic_closed');
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->index(['date', 'type']);
        });

        Schema::table('pengajuan', function (Blueprint $table) {
            $table->boolean('reschedule_required')->default(false);
            $table->text('reschedule_reason')->nullable();
            $table->timestamp('reschedule_requested_at')->nullable();
            $table->timestamp('reminder_sent_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropColumn(['reschedule_required', 'reschedule_reason', 'reschedule_requested_at', 'reminder_sent_at']);
        });
        Schema::dropIfExists('academic_calendar_dates');
    }
};

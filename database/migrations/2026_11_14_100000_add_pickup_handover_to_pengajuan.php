<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $t) {
            $t->timestamp('pickup_ready_at')->nullable();
            $t->foreignId('pickup_ready_by')->nullable()->constrained('users')->nullOnDelete();
            $t->string('collector_name', 150)->nullable();
            $t->string('collector_contact', 100)->nullable();
            $t->string('handover_photo_path')->nullable();
            $t->timestamp('handed_over_at')->nullable();
            $t->foreignId('handed_over_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $t) {
            $t->dropConstrainedForeignId('pickup_ready_by');
            $t->dropConstrainedForeignId('handed_over_by');
            $t->dropColumn(['pickup_ready_at', 'collector_name', 'collector_contact', 'handover_photo_path', 'handed_over_at']);
        });
    }
};

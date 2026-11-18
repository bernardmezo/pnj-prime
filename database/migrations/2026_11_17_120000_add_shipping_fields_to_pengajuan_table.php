<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Data pengiriman kurir untuk pemenuhan produk "Diantar" (Jalur B, ready stock).
 * Alur: Diproses -> Dikirim (nama kurir + no. resi) -> Selesai.
 * Semua kolom baru nullable; data lama tidak disentuh.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $t) {
            $t->string('courier_name', 100)->nullable()->after('catatan_peninjau');
            $t->string('tracking_number', 100)->nullable()->after('courier_name');
            $t->timestamp('shipped_at')->nullable()->after('tracking_number');
            $t->foreignId('shipped_by')->nullable()->after('shipped_at')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $t) {
            $t->dropConstrainedForeignId('shipped_by');
            $t->dropColumn(['courier_name', 'tracking_number', 'shipped_at']);
        });
    }
};

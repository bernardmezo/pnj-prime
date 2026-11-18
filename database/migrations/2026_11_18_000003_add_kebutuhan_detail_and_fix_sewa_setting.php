<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Sprint 4 #3 — Jasa test lab & sewa fasilitas
 *
 * 1. Kolom kebutuhan_detail (JSON) di pengajuan → isian detail test lab
 * 2. Setting sewa_perlu_persetujuan_pimpinan → 0 (hanya Admin RTPU)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->json('kebutuhan_detail')->nullable()->after('keperluan')
                ->comment('Isian detail test lab / jasa konsultasi: jenis_pengujian, metode, jumlah_sampel, standar, catatan_biaya');
        });

        // Hapus setting Pimpinan dari alur sewa — cukup Admin RTPU saja.
        DB::table('settings')
            ->where('key', 'sewa_perlu_persetujuan_pimpinan')
            ->update([
                'value' => '0',
                'description' => 'Persetujuan sewa hanya oleh Admin RTPU. Alihkan ke 1 jika Pimpinan RTPU perlu ikut menyetujui.',
            ]);
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropColumn('kebutuhan_detail');
        });

        DB::table('settings')
            ->where('key', 'sewa_perlu_persetujuan_pimpinan')
            ->update(['value' => '1']);
    }
};

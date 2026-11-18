<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tugas #4 Sprint 4: Alur pengerjaan jasa
     *
     * Kolom baru (semua nullable / punya default, data lama aman):
     * - hasil_files           JSON array: daftar path + nama file hasil kerja Pengelola
     * - jadwal_mulai          datetime: kapan Pengelola mulai mengerjakan
     * - jadwal_selesai        datetime: perkiraan selesai
     * - revision_count        tinyint: jumlah revisi yang sudah diminta Customer (maks 2)
     * - rating                tinyint 1–5: penilaian Customer setelah Selesai
     * - ulasan                text: komentar Customer bersama rating
     * - rating_at             timestamp: kapan rating diberikan
     * - selesai_confirmed_at  timestamp: kapan Customer konfirmasi selesai
     */
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->json('hasil_files')->nullable()->after('kebutuhan_detail')
                ->comment('Daftar file hasil kerja Pengelola: [{path, name, size}]');
            $table->dateTime('jadwal_mulai')->nullable()->after('hasil_files');
            $table->dateTime('jadwal_selesai')->nullable()->after('jadwal_mulai');
            $table->unsignedTinyInteger('revision_count')->default(0)->after('jadwal_selesai');
            $table->unsignedTinyInteger('rating')->nullable()->after('revision_count')
                ->comment('1–5 bintang');
            $table->text('ulasan')->nullable()->after('rating');
            $table->timestamp('rating_at')->nullable()->after('ulasan');
            $table->timestamp('selesai_confirmed_at')->nullable()->after('rating_at');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropColumn([
                'hasil_files',
                'jadwal_mulai',
                'jadwal_selesai',
                'revision_count',
                'rating',
                'ulasan',
                'rating_at',
                'selesai_confirmed_at',
            ]);
        });
    }
};

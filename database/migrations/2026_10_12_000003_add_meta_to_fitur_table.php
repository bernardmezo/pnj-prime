<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds presentation/permission metadata to `fitur`:
 *   - grup           : sidebar/matrix grouping label
 *   - aksi_tersedia  : JSON list of actions this fitur exposes
 *   - urutan         : manual sort order inside a group
 *   - terkunci       : locked (protected) flag
 *
 * Additive only — existing rows are backfilled here; `migrate:fresh` inserts
 * the same metadata through UsecaseSeeder.
 */
return new class extends Migration
{
    /** Five canonical actions, mirrored from Permission::AKSI. */
    private const AKSI = ['Lihat', 'Tambah', 'Ubah', 'Hapus', 'Verifikasi'];

    /** Default metadata for the fitur shipped with the app. */
    private const META = [
        'katalog' => ['grup' => 'Layanan', 'urutan' => 1],
        'pengajuan' => ['grup' => 'Layanan', 'urutan' => 2],
        'verifikasi' => ['grup' => 'Layanan', 'urutan' => 3],
        'pembayaran' => ['grup' => 'Pembayaran', 'urutan' => 4],
        'produk-unggulan' => ['grup' => 'P3M', 'urutan' => 5],
        'pengguna' => ['grup' => 'Administrasi', 'urutan' => 6],
        'hak-akses' => ['grup' => 'Administrasi', 'urutan' => 7],
        'fitur' => ['grup' => 'Administrasi', 'urutan' => 8],
    ];

    private const PROTECTED = ['pengguna', 'hak-akses', 'fitur'];

    public function up(): void
    {
        Schema::table('fitur', function (Blueprint $table) {
            $table->string('grup')->default('Lainnya');
            $table->json('aksi_tersedia')->nullable();
            $table->integer('urutan')->default(0);
            $table->boolean('terkunci')->default(false);
        });

        $aksi = json_encode(self::AKSI);

        foreach (self::META as $key => $meta) {
            DB::table('fitur')->where('key', $key)->update([
                'grup' => $meta['grup'],
                'urutan' => $meta['urutan'],
                'aksi_tersedia' => $aksi,
                'terkunci' => in_array($key, self::PROTECTED, true),
            ]);
        }

        // Any other (custom) fitur keeps the default group but gets the full
        // action set so the matrix stays usable.
        DB::table('fitur')->whereNull('aksi_tersedia')->update(['aksi_tersedia' => $aksi]);
    }

    public function down(): void
    {
        Schema::table('fitur', function (Blueprint $table) {
            $table->dropColumn(['grup', 'aksi_tersedia', 'urutan', 'terkunci']);
        });
    }
};

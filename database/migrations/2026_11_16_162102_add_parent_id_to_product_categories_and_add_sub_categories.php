<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah parent_id ke product_categories untuk membuat hierarki 2 level:
 * - Level 1 (parent_id NULL): tipe besar — Produk Fisik, Jasa/Layanan, Sewa Fasilitas
 * - Level 2 (parent_id diisi): sub-kategori detail — Elektronik, Peralatan Lab, dll
 *
 * Data lama (3 kategori tipe) tidak diubah sama sekali.
 * Slug lama (produk-fisik, jasa-layanan, sewa-fasilitas) tetap sama.
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Tambah kolom parent_id (nullable, FK ke diri sendiri)
        Schema::table('product_categories', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_id')
                ->nullable()
                ->after('id')
                ->comment('NULL = kategori tipe (level 1); diisi = sub-kategori (level 2)');

            $table->foreign('parent_id')
                ->references('id')
                ->on('product_categories')
                ->nullOnDelete();
        });

        // 2. Seed sub-kategori awal (di bawah "Produk Fisik" id=1)
        // Ambil id parent secara dinamis agar aman jika id berbeda
        $produkFisikId = DB::table('product_categories')->where('slug', 'produk-fisik')->value('id');
        $jasaLayananId = DB::table('product_categories')->where('slug', 'jasa-layanan')->value('id');
        $sewaId        = DB::table('product_categories')->where('slug', 'sewa-fasilitas')->value('id');

        $now = now();

        if ($produkFisikId) {
            DB::table('product_categories')->insert([
                ['parent_id' => $produkFisikId, 'name' => 'Kebersihan',          'slug' => 'kebersihan',          'is_active' => true, 'sort_order' => 10, 'created_at' => $now, 'updated_at' => $now],
                ['parent_id' => $produkFisikId, 'name' => 'Elektronik',          'slug' => 'elektronik',          'is_active' => true, 'sort_order' => 20, 'created_at' => $now, 'updated_at' => $now],
                ['parent_id' => $produkFisikId, 'name' => 'Peralatan Lab',       'slug' => 'peralatan-lab',       'is_active' => true, 'sort_order' => 30, 'created_at' => $now, 'updated_at' => $now],
                ['parent_id' => $produkFisikId, 'name' => 'Alat Ukur',           'slug' => 'alat-ukur',           'is_active' => true, 'sort_order' => 40, 'created_at' => $now, 'updated_at' => $now],
                ['parent_id' => $produkFisikId, 'name' => 'Perlengkapan Kantor', 'slug' => 'perlengkapan-kantor', 'is_active' => true, 'sort_order' => 50, 'created_at' => $now, 'updated_at' => $now],
                ['parent_id' => $produkFisikId, 'name' => 'Lainnya',             'slug' => 'produk-lainnya',      'is_active' => true, 'sort_order' => 99, 'created_at' => $now, 'updated_at' => $now],
            ]);
        }

        if ($jasaLayananId) {
            DB::table('product_categories')->insert([
                ['parent_id' => $jasaLayananId, 'name' => 'Pengujian Lab',       'slug' => 'pengujian-lab',       'is_active' => true, 'sort_order' => 10, 'created_at' => $now, 'updated_at' => $now],
                ['parent_id' => $jasaLayananId, 'name' => 'Konsultasi & Riset',  'slug' => 'konsultasi-riset',    'is_active' => true, 'sort_order' => 20, 'created_at' => $now, 'updated_at' => $now],
                ['parent_id' => $jasaLayananId, 'name' => 'Pelatihan',           'slug' => 'pelatihan',           'is_active' => true, 'sort_order' => 30, 'created_at' => $now, 'updated_at' => $now],
                ['parent_id' => $jasaLayananId, 'name' => 'Lainnya',             'slug' => 'jasa-lainnya',        'is_active' => true, 'sort_order' => 99, 'created_at' => $now, 'updated_at' => $now],
            ]);
        }

        if ($sewaId) {
            DB::table('product_categories')->insert([
                ['parent_id' => $sewaId, 'name' => 'Ruangan',    'slug' => 'ruangan',    'is_active' => true, 'sort_order' => 10, 'created_at' => $now, 'updated_at' => $now],
                ['parent_id' => $sewaId, 'name' => 'Peralatan',  'slug' => 'peralatan',  'is_active' => true, 'sort_order' => 20, 'created_at' => $now, 'updated_at' => $now],
                ['parent_id' => $sewaId, 'name' => 'Lainnya',    'slug' => 'sewa-lainnya', 'is_active' => true, 'sort_order' => 99, 'created_at' => $now, 'updated_at' => $now],
            ]);
        }
    }

    public function down(): void
    {
        // Hapus sub-kategori (parent_id NOT NULL) lalu drop kolom
        DB::table('product_categories')->whereNotNull('parent_id')->delete();

        Schema::table('product_categories', function (Blueprint $table) {
            $table->dropForeign(['parent_id']);
            $table->dropColumn('parent_id');
        });
    }
};

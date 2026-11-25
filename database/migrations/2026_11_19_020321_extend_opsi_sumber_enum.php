<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            return;
        }

        Schema::create('opsi_tmp', function ($table) {
            $table->id();
            $table->string('opsi_type');
            $table->unsignedBigInteger('opsi_id');
            $table->enum('jenis', ['termasuk', 'addon']);
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->integer('harga')->default(0);
            $table->enum('satuan', ['flat', 'per_hari', 'per_jam', 'per_orang', 'per_unit'])->default('flat');
            $table->integer('qty_min')->default(1);
            $table->integer('qty_max')->nullable();
            $table->integer('stok')->nullable();
            $table->boolean('aktif')->default(true);
            $table->integer('urutan')->default(0);
            $table->enum('sumber', ['admin', 'usulan_p3m', 'pengelola'])->default('admin');
            $table->timestamps();
            $table->softDeletes();
        });

        DB::statement('INSERT INTO opsi_tmp (id, opsi_type, opsi_id, jenis, nama, deskripsi, harga, satuan, qty_min, qty_max, stok, aktif, urutan, sumber, created_at, updated_at, deleted_at) SELECT id, opsi_type, opsi_id, jenis, nama, deskripsi, harga, satuan, qty_min, qty_max, stok, aktif, urutan, sumber, created_at, updated_at, deleted_at FROM opsi');

        Schema::drop('opsi');
        Schema::rename('opsi_tmp', 'opsi');
    }

    public function down(): void
    {
        // Irreversible without data loss for rows with sumber='pengelola'.
    }
};

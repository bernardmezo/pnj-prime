<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opsi', function (Blueprint $table) {
            $table->id();

            // Polymorphic owner: a Layanan (Product) or a Produk Unggulan.
            $table->morphs('opsi');

            $table->enum('jenis', ['termasuk', 'addon']);
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->unsignedBigInteger('harga')->default(0);
            $table->enum('satuan', ['flat', 'per_hari', 'per_jam', 'per_orang', 'per_unit'])->default('flat');
            $table->unsignedInteger('qty_min')->default(1);
            $table->unsignedInteger('qty_max')->nullable();
            $table->unsignedInteger('stok')->nullable();
            $table->boolean('aktif')->default(true);
            $table->unsignedInteger('urutan')->default(0);
            $table->enum('sumber', ['admin', 'usulan_p3m'])->default('admin');

            $table->timestamps();
            $table->softDeletes();

            $table->unique(['opsi_type', 'opsi_id', 'jenis', 'nama'], 'opsi_owner_jenis_nama_unique');
        });

        // DB-level guard: an "included" option is always free. SQLite cannot
        // ALTER TABLE ... ADD CONSTRAINT, so that engine relies on the Opsi
        // model's saving hook (which is enforced in every environment).
        if (in_array(DB::connection()->getDriverName(), ['mysql', 'pgsql', 'sqlsrv'], true)) {
            DB::statement("ALTER TABLE opsi ADD CONSTRAINT opsi_termasuk_harga_zero CHECK (jenis <> 'termasuk' OR harga = 0)");
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('opsi');
    }
};

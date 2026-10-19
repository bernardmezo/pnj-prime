<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pengajuan_opsi', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pengajuan_id')
                ->constrained('pengajuan')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            // Nullable: price/name snapshot survives an option being deleted.
            $table->foreignId('opsi_id')
                ->nullable()
                ->constrained('opsi')
                ->cascadeOnUpdate()
                ->nullOnDelete();

            $table->enum('jenis', ['termasuk', 'addon']);
            $table->string('nama');
            $table->unsignedBigInteger('harga')->default(0);
            $table->enum('satuan', ['flat', 'per_hari', 'per_jam', 'per_orang', 'per_unit'])->default('flat');
            $table->unsignedInteger('qty')->default(1);
            $table->unsignedBigInteger('subtotal')->default(0);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pengajuan_opsi');
    }
};

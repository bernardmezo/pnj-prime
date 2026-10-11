<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fitur', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('nama');
            $table->text('deskripsi')->nullable();
            $table->boolean('aktif')->default(true);
            $table->timestamps();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->id();
            $table->string('role', 32);
            $table->string('fitur_key', 64);
            $table->string('aksi', 24);
            $table->boolean('allowed')->default(false);
            $table->timestamps();
            $table->unique(['role', 'fitur_key', 'aksi'], 'permissions_role_fitur_aksi_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permissions');
        Schema::dropIfExists('fitur');
    }
};

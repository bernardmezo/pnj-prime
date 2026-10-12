<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('produk_unggulan', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->foreignId('owner_id')->constrained('users')->cascadeOnUpdate()->restrictOnDelete();
            $table->string('name');
            $table->longText('description')->nullable();
            $table->string('researcher')->nullable();
            $table->string('team')->nullable();
            $table->string('category')->nullable();
            $table->unsignedBigInteger('price')->nullable();
            $table->json('documents')->nullable();
            $table->string('status', 20)->default('Diajukan');
            $table->text('catatan')->nullable();
            $table->json('history')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('produk_unggulan');
    }
};

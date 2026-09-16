<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();

            $table->foreignId('buyer_id')
                ->constrained('users')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('tax_amount')->default(0);
            $table->unsignedBigInteger('total');

            $table->enum('status', [
                'menunggu_pembayaran',
                'menunggu_verifikasi',
                'diproses',
                'selesai',
                'dibatalkan',
            ])->default('menunggu_pembayaran');

            $table->enum('order_type', ['b2c', 'b2b'])->default('b2c')->nullable();

            $table->text('buyer_notes')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
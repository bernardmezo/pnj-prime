<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('request_id')->constrained('pengajuan')->cascadeOnDelete();
            $table->string('order_id', 50)->unique();
            $table->unsignedBigInteger('gross_amount');
            $table->string('snap_token')->nullable();
            $table->string('status')->default('pending'); // pending, paid, failed, expired, refunded
            $table->string('payment_type')->nullable(); // bank_transfer, credit_card, qris, gopay, etc.
            $table->string('transaction_id')->nullable();
            $table->json('raw_response')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['request_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};

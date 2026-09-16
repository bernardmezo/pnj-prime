<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Create order_items table.
 *
 * Snapshot pricing at time of order — product price is copied here so that
 * future product price changes do not affect historical orders.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();
            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnUpdate()
                ->restrictOnDelete();

            $table->string('product_name');         // snapshot of name at order time
            $table->unsignedBigInteger('unit_price'); // snapshot of price at order time
            $table->unsignedInteger('quantity')->default(1);
            $table->unsignedBigInteger('subtotal');   // unit_price * quantity

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
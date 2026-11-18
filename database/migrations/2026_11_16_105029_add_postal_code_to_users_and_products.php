<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add postal code columns for shipping calculation.
     * 
     * - users.postal_code: Customer's delivery address postal code (5 digits)
     * - users.address: Full delivery address (street, RT/RW, kelurahan, kecamatan)
     * - products.origin_postal_code: Warehouse/pengelola postal code (5 digits, stored in meta)
     * 
     * Nullable to allow existing data to remain valid.
     * Customer will be prompted to fill postal code at checkout.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('postal_code', 10)->nullable()->after('institution');
            $table->text('address')->nullable()->after('postal_code');
        });

        // Note: products.origin_postal_code stored in meta JSON column (already exists)
        // No schema change needed for products table
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['postal_code', 'address']);
        });
    }
};

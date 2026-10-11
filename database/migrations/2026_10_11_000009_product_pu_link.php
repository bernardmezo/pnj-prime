<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('produk_unggulan_id')->nullable()->after('approved_by')
                ->constrained('produk_unggulan')->cascadeOnUpdate()->nullOnDelete();
            $table->unique('produk_unggulan_id', 'products_produk_unggulan_unique');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropUnique('products_produk_unggulan_unique');
            $table->dropConstrainedForeignId('produk_unggulan_id');
        });
    }
};

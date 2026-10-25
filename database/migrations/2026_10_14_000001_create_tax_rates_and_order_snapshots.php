<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tax_rates', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('name', 150);
            $table->decimal('rate', 5, 2)->default(0.00); // e.g. 11.00 for 11%
            $table->string('category', 50)->nullable(); // e.g. 'jasa', 'ruangan', 'produk'
            $table->unsignedBigInteger('threshold_amount')->nullable();
            $table->boolean('is_active')->default(true);
            $table->date('effective_from')->nullable();
            $table->date('effective_until')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['is_active', 'category']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('tax_rate_id')->nullable()->after('is_active')
                ->constrained('tax_rates')->nullOnDelete();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('tax_rate_id')->nullable()->after('tax_amount')
                ->constrained('tax_rates')->nullOnDelete();
            $table->decimal('tax_rate_snapshot', 5, 2)->nullable()->after('tax_rate_id');
            $table->string('tax_name_snapshot', 150)->nullable()->after('tax_rate_snapshot');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tax_rate_id');
            $table->dropColumn(['tax_rate_snapshot', 'tax_name_snapshot']);
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tax_rate_id');
        });

        Schema::dropIfExists('tax_rates');
    }
};

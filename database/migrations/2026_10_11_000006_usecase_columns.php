<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('pengajuan_id')->nullable()->after('buyer_id')
                ->constrained('pengajuan')->cascadeOnUpdate()->nullOnDelete();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('role');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->json('meta')->nullable()->after('thumbnail');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('meta');
        });
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
        Schema::table('orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('pengajuan_id');
        });
    }
};

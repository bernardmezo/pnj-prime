<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tambah index untuk query agregasi dashboard Direktorat.
 * Semua kolom nullable/tidak; down() menghapus index saja, data aman.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->index('status', 'pengajuan_status_idx');
            $table->index('created_at', 'pengajuan_created_at_idx');
            $table->index(['status', 'created_at'], 'pengajuan_status_created_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index('status', 'orders_status_idx');
            $table->index('completed_at', 'orders_completed_at_idx');
            $table->index(['status', 'completed_at'], 'orders_status_completed_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('role', 'users_role_idx');
            $table->index(['role', 'created_at'], 'users_role_created_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->index('curation_status', 'products_curation_status_idx');
            $table->index(['curation_status', 'is_active'], 'products_curation_active_idx');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->index('order_id', 'order_items_order_id_idx');
        });
    }

    public function down(): void
    {
        Schema::table('pengajuan', function (Blueprint $table) {
            $table->dropIndex('pengajuan_status_idx');
            $table->dropIndex('pengajuan_created_at_idx');
            $table->dropIndex('pengajuan_status_created_idx');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex('orders_status_idx');
            $table->dropIndex('orders_completed_at_idx');
            $table->dropIndex('orders_status_completed_idx');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_role_idx');
            $table->dropIndex('users_role_created_idx');
        });

        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex('products_curation_status_idx');
            $table->dropIndex('products_curation_active_idx');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex('order_items_order_id_idx');
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $isPgsql = DB::getDriverName() === 'pgsql';

        // 1. Expand orders_status_check to include 'lunas'
        if ($isPgsql) {
            DB::statement('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check');
            DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('menunggu_pembayaran', 'menunggu_verifikasi', 'lunas', 'diproses', 'selesai', 'dibatalkan'))");
        }

        // 2. Expand products_curation_status_check to include 'verified'
        if ($isPgsql) {
            DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_curation_status_check');
            DB::statement("ALTER TABLE products ADD CONSTRAINT products_curation_status_check CHECK (curation_status IN ('draft', 'pending', 'verified', 'approved', 'rejected'))");
        }

        // 3. Expand users_role_check to include 'admin_pengelola'
        if ($isPgsql) {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin_rtpu', 'admin_p3m', 'admin_pengelola', 'pimpinan_rtpu', 'direktur', 'super_admin'))");
        }

        // 4. Add account_status and unit info to users table
        Schema::table('users', function (Blueprint $table) {
            $table->string('account_status', 30)->default('active')->after('is_active');
            $table->string('unit_name', 100)->nullable()->after('institution');
            $table->unsignedBigInteger('unit_id')->nullable()->after('unit_name');
        });

        if ($isPgsql) {
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_account_status_check CHECK (account_status IN ('pending', 'active', 'suspended', 'rejected'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $isPgsql = DB::getDriverName() === 'pgsql';

        if ($isPgsql) {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_account_status_check');
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['account_status', 'unit_name', 'unit_id']);
        });

        if ($isPgsql) {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin_rtpu', 'admin_p3m', 'pimpinan_rtpu', 'direktur', 'super_admin'))");

            DB::statement('ALTER TABLE products DROP CONSTRAINT IF EXISTS products_curation_status_check');
            DB::statement("ALTER TABLE products ADD CONSTRAINT products_curation_status_check CHECK (curation_status IN ('draft', 'pending', 'approved', 'rejected'))");

            DB::statement('ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check');
            DB::statement("ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('menunggu_pembayaran', 'menunggu_verifikasi', 'diproses', 'selesai', 'dibatalkan'))");
        }
    }
};

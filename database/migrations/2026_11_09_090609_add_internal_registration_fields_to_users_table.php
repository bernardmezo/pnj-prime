<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add nip, jurusan, prodi columns and expand role enum to include admin_jurusan.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('nip', 30)->nullable()->after('phone');
            $table->string('jurusan', 100)->nullable()->after('nip');
            $table->string('prodi', 100)->nullable()->after('jurusan');
        });

        // Expand role constraint to include admin_jurusan
        $isPgsql = DB::getDriverName() === 'pgsql';
        $isSqlite = DB::getDriverName() === 'sqlite';

        if ($isPgsql) {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin_rtpu', 'admin_p3m', 'admin_pengelola', 'admin_jurusan', 'pimpinan_rtpu', 'direktur', 'super_admin'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $isPgsql = DB::getDriverName() === 'pgsql';

        // Remap admin_jurusan back to customer before tightening constraint
        if ($isPgsql) {
            DB::table('users')->where('role', 'admin_jurusan')->update(['role' => 'customer']);
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check');
            DB::statement("ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin_rtpu', 'admin_p3m', 'admin_pengelola', 'pimpinan_rtpu', 'direktur', 'super_admin'))");
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['nip', 'jurusan', 'prodi']);
        });
    }
};

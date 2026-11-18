<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Add katalog permissions for admin_pengelola: Lihat and Ubah only
        // Tambah and Hapus are reserved for admin_rtpu
        $permissions = [
            ['role' => 'admin_pengelola', 'fitur_key' => 'katalog', 'aksi' => 'Lihat', 'allowed' => true],
            ['role' => 'admin_pengelola', 'fitur_key' => 'katalog', 'aksi' => 'Ubah', 'allowed' => true],
        ];

        foreach ($permissions as $perm) {
            DB::table('permissions')->insertOrIgnore($perm);
        }
    }

    public function down(): void
    {
        DB::table('permissions')
            ->where('role', 'admin_pengelola')
            ->where('fitur_key', 'katalog')
            ->whereIn('aksi', ['Lihat', 'Ubah'])
            ->delete();
    }
};

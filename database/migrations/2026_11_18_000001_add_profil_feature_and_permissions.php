<?php

use App\Models\Fitur;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Fitur profil sendiri: setiap role punya Lihat dan Ubah profilnya.
     * Hapus tidak diberikan kepada siapa pun. Super Admin tetap lolos lewat
     * bypass User::canDo(), sama seperti fitur lain.
     */
    public function up(): void
    {
        Fitur::firstOrCreate(
            ['key' => 'profil'],
            [
                'nama' => 'Profil Saya',
                'deskripsi' => 'Melihat dan mengubah informasi akun sendiri.',
                'aktif' => true,
                'grup' => 'Administrasi',
                'urutan' => 12,
                'aksi_tersedia' => Permission::AKSI,
                'terkunci' => true,
            ]
        );

        $roles = ['customer', 'admin_pengelola', 'admin_jurusan', 'admin_p3m', 'admin_rtpu', 'pimpinan_rtpu', 'direktur', 'super_admin'];

        foreach ($roles as $role) {
            foreach (Permission::AKSI as $aksi) {
                Permission::updateOrCreate(
                    ['role' => $role, 'fitur_key' => 'profil', 'aksi' => $aksi],
                    ['allowed' => $role === 'super_admin' || in_array($aksi, ['Lihat', 'Ubah'], true)]
                );
            }
        }

        User::flushPermissionCache();
    }

    public function down(): void
    {
        Permission::where('fitur_key', 'profil')->delete();
        Fitur::where('key', 'profil')->delete();
        User::flushPermissionCache();
    }
};

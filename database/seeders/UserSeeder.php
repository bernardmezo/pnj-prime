<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * UserSeeder
 *
 * Creates one demo user for each of the 4 PNJ Prime roles.
 * Passwords are all 'password' — change before any demo to a real audience.
 *
 * Login credentials:
 *   admin@pnjprime.test     / password  -> admin_rtpu
 *   dosen@pnjprime.test     / password  -> dosen_peneliti
 *   mahasiswa@pnjprime.test / password  -> mahasiswa
 *   mitra@pnjprime.test     / password  -> eksternal
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin RTPU — full dashboard access
        User::factory()->adminRtpu()->create([
            'name'  => 'Admin RTPU',
            'email' => 'admin@pnjprime.test',
        ]);

        // Dosen Peneliti — submit products, view own transaction reports
        User::factory()->dosenPeneliti()->create([
            'name'  => 'Dr. Budi Santoso',
            'email' => 'dosen@pnjprime.test',
        ]);

        // Mahasiswa — innovator role (similar access to dosen where relevant)
        User::factory()->mahasiswa()->create([
            'name'  => 'Rina Mahasiswi',
            'email' => 'mahasiswa@pnjprime.test',
        ]);

        // Eksternal — external buyer (self-registered)
        User::factory()->eksternal()->create([
            'name'        => 'PT Mitra Teknologi',
            'email'       => 'mitra@pnjprime.test',
            'institution' => 'PT Mitra Teknologi Indonesia',
        ]);

        // Extra random users for realistic browsing data
        User::factory()->count(5)->eksternal()->create();
        User::factory()->count(3)->dosenPeneliti()->create();
        User::factory()->count(5)->mahasiswa()->create();
    }
}
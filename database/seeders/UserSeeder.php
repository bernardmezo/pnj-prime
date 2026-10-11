<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

/**
 * UserSeeder
 *
 * Demo accounts, all with password 'password'. Idempotent (updateOrCreate
 * by email), safe to re-run.
 *
 * Login credentials:
 *   admin@pnjprime.test      -> admin_rtpu
 *   p3m@pnjprime.test        -> admin_p3m
 *   pimpinan@pnjprime.test   -> pimpinan_rtpu
 *   direktur@pnjprime.test   -> direktur
 *   superadmin@pnjprime.test -> super_admin
 *   dosen@pnjprime.test      -> customer (legacy civitas account)
 *   mahasiswa@pnjprime.test  -> customer (legacy civitas account)
 *   mitra@pnjprime.test      -> customer
 */
class UserSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['Admin RTPU', 'admin@pnjprime.test', 'admin_rtpu', null],
            ['Admin P3M', 'p3m@pnjprime.test', 'admin_p3m', null],
            ['Pimpinan RTPU', 'pimpinan@pnjprime.test', 'pimpinan_rtpu', null],
            ['Direktur PNJ', 'direktur@pnjprime.test', 'direktur', null],
            ['Super Admin', 'superadmin@pnjprime.test', 'super_admin', null],
            ['Dr. Budi Santoso', 'dosen@pnjprime.test', 'customer', null],
            ['Rina Mahasiswi', 'mahasiswa@pnjprime.test', 'customer', null],
            ['PT Mitra Teknologi', 'mitra@pnjprime.test', 'customer', 'PT Mitra Teknologi Indonesia'],
        ] as [$name, $email, $role, $institution]) {
            User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name,
                    'password' => Hash::make('password'),
                    'role' => $role,
                    'account_origin' => 'local_simulation',
                    'institution' => $institution,
                    'email_verified_at' => now(),
                ]
            );
        }

        // Extra random users for realistic browsing data
        User::factory()->count(8)->customer()->create();
        User::factory()->count(3)->adminP3m()->create();
    }
}

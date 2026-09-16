<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            [
                'key'         => 'ppn_enabled',
                'value'       => '0',
                'type'        => 'boolean',
                'label'       => 'PPN Diaktifkan',
                'description' => 'Apakah PPN diterapkan pada transaksi?',
                'is_public'   => false,
            ],
            [
                'key'         => 'ppn_rate',
                'value'       => null,
                'type'        => 'integer',
                'label'       => 'Tarif PPN (%)',
                'description' => 'Persentase tarif PPN.',
                'is_public'   => false,
            ],
            [
                'key'         => 'payment_bank_name',
                'value'       => 'Bank Mandiri',
                'type'        => 'string',
                'label'       => 'Nama Bank Pembayaran',
                'description' => 'Bank yang digunakan untuk pembayaran ke rekening BLU PNJ.',
                'is_public'   => true,
            ],
            [
                'key'         => 'payment_account_number',
                'value'       => '',
                'type'        => 'string',
                'label'       => 'Nomor Rekening BLU',
                'description' => 'Nomor rekening Bank Mandiri BLU PNJ untuk pembayaran.',
                'is_public'   => true,
            ],
            [
                'key'         => 'payment_account_holder',
                'value'       => 'Politeknik Negeri Jakarta',
                'type'        => 'string',
                'label'       => 'Nama Pemilik Rekening',
                'description' => 'Nama pemilik rekening yang ditampilkan ke pembeli.',
                'is_public'   => true,
            ],
            [
                'key'         => 'platform_maintenance_mode',
                'value'       => '0',
                'type'        => 'boolean',
                'label'       => 'Mode Maintenance',
                'description' => 'Tampilkan halaman maintenance ke pengunjung publik.',
                'is_public'   => false,
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->insertOrIgnore(
                array_merge($setting, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
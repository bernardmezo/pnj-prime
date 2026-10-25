<?php

namespace Database\Seeders;

use App\Models\TaxRate;
use Illuminate\Database\Seeder;

class TaxRateSeeder extends Seeder
{
    public function run(): void
    {
        $rates = [
            [
                'code' => 'PPN11',
                'name' => 'PPN 11%',
                'rate' => 11.00,
                'category' => null, // applies generally
                'is_active' => true,
            ],
            [
                'code' => 'PPN_SEWA',
                'name' => 'PPN Sewa Gedung & Ruang 11%',
                'rate' => 11.00,
                'category' => 'ruangan',
                'is_active' => true,
            ],
            [
                'code' => 'BEBAS_PAJAK',
                'name' => 'Non-Objek Pajak / Bebas PPN',
                'rate' => 0.00,
                'category' => 'pendidikan',
                'is_active' => true,
            ],
        ];

        foreach ($rates as $rate) {
            TaxRate::firstOrCreate(['code' => $rate['code']], $rate);
        }
    }
}

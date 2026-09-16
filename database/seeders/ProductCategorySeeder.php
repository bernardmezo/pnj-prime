<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name'        => 'Produk Fisik',
                'slug'        => 'produk-fisik',
                'description' => 'Produk tangible hasil penelitian dan inovasi sivitas akademika PNJ.',
                'icon'        => 'icon-box',
                'sort_order'  => 1,
            ],
            [
                'name'        => 'Jasa / Layanan',
                'slug'        => 'jasa-layanan',
                'description' => 'Layanan konsultasi, pelatihan, pengujian, dan jasa profesional lainnya.',
                'icon'        => 'icon-briefcase',
                'sort_order'  => 2,
            ],
            [
                'name'        => 'Sewa Fasilitas',
                'slug'        => 'sewa-fasilitas',
                'description' => 'Peminjaman dan sewa fasilitas laboratorium, ruang, serta peralatan PNJ.',
                'icon'        => 'icon-building',
                'sort_order'  => 3,
            ],
        ];

        foreach ($categories as $category) {
            DB::table('product_categories')->insertOrIgnore(
                array_merge($category, [
                    'is_active'  => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
}
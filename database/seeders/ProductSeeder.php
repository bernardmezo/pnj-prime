<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    /**
     * Dummy catalog data: approved items fill the public catalog/landing,
     * plus a few pending/draft items so the curation queue is demoable.
     */
    public function run(): void
    {
        $owner = User::where('email', 'dosen@pnjprime.test')->first()
            ?? User::whereIn('role', ['dosen_peneliti', 'mahasiswa'])->first();
        $approver = User::where('email', 'admin@pnjprime.test')->first()
            ?? User::where('role', 'admin_rtpu')->first();

        if (! $owner) {
            $this->command->warn('ProductSeeder: no owner user found, skipping.');
            return;
        }

        $catId = fn (string $slug) => ProductCategory::where('slug', $slug)->value('id');

        $items = [
            // Produk fisik
            ['cat' => 'produk-fisik', 'name' => 'Alat Uji Kualitas Air Portable', 'short' => 'Kit uji pH, TDS, dan kekeruhan air dalam satu koper jinjing.', 'base' => 2600000, 'final' => 2450000, 'stock' => 16, 'status' => 'approved'],
            ['cat' => 'produk-fisik', 'name' => 'Modul Trainer IoT Berbasis ESP32', 'short' => 'Media pembelajaran IoT dengan sensor suhu, cahaya, dan relay.', 'base' => 1350000, 'final' => 1275000, 'stock' => 24, 'status' => 'approved'],
            ['cat' => 'produk-fisik', 'name' => 'Mesin Pencacah Sampah Organik', 'short' => 'Pencacah sampah dapur dan kebun kapasitas 50 kg/jam.', 'base' => 4200000, 'final' => 3900000, 'stock' => 8, 'status' => 'approved'],
            ['cat' => 'produk-fisik', 'name' => 'Briket Arang Tempurung Otomatis', 'short' => 'Mesin pres briket arang tempurung kelapa semi-otomatis.', 'base' => 5800000, 'final' => 5450000, 'stock' => 5, 'status' => 'pending'],
            // Jasa pengujian
            ['cat' => 'jasa-layanan', 'name' => 'Pengujian Kuat Tekan Beton', 'short' => 'Uji kuat tekan silinder dan kubus beton di Gedung PUT.', 'base' => 350000, 'final' => 350000, 'stock' => null, 'status' => 'approved'],
            ['cat' => 'jasa-layanan', 'name' => 'Kalibrasi Alat Ukur Listrik', 'short' => 'Kalibrasi multimeter, clamp meter, dan power analyzer.', 'base' => 225000, 'final' => 225000, 'stock' => null, 'status' => 'approved'],
            ['cat' => 'jasa-layanan', 'name' => 'Uji Tarik Material Logam', 'short' => 'Uji tarik dan kekerasan material logam standar ASTM.', 'base' => 400000, 'final' => 375000, 'stock' => null, 'status' => 'pending'],
            // Sewa fasilitas
            ['cat' => 'sewa-fasilitas', 'name' => 'Ruang Rapat Lantai 2', 'short' => 'Ruang rapat kapasitas 10 orang, proyektor dan coffee break tersedia.', 'base' => 550000, 'final' => 550000, 'stock' => null, 'status' => 'approved'],
            ['cat' => 'sewa-fasilitas', 'name' => 'Aula Gedung Serbaguna PNJ', 'short' => 'Aula kapasitas 300 orang untuk seminar, wisuda, dan expo.', 'base' => 4500000, 'final' => 4500000, 'stock' => null, 'status' => 'approved'],
            ['cat' => 'sewa-fasilitas', 'name' => 'Lab Komputer 40 Unit', 'short' => 'Sewa lab komputer untuk pelatihan dan sertifikasi.', 'base' => 1200000, 'final' => 1100000, 'stock' => null, 'status' => 'approved'],
            ['cat' => 'sewa-fasilitas', 'name' => 'Workshop Fabrikasi Logam', 'short' => 'Sewa workshop bubut, frais, dan las per hari kerja.', 'base' => 900000, 'final' => 850000, 'stock' => null, 'status' => 'draft'],
        ];

        foreach ($items as $item) {
            $categoryId = $catId($item['cat']);
            if (! $categoryId) {
                continue;
            }
            $slug = Str::slug($item['name']);
            Product::updateOrCreate(
                ['slug' => $slug],
                [
                    'owner_id'          => $owner->id,
                    'category_id'       => $categoryId,
                    'name'              => $item['name'],
                    'short_description' => $item['short'],
                    'description'       => $item['short'] . ' Diajukan melalui PNJ Prime dan dikurasi oleh Admin RTPU sebelum tayang di katalog publik.',
                    'thumbnail'         => '/assets/product.jpg',
                    'base_price'        => $item['base'],
                    'final_price'       => $item['final'],
                    'curation_status'   => $item['status'],
                    'approved_at'       => $item['status'] === 'approved' ? now() : null,
                    'approved_by'       => $item['status'] === 'approved' ? $approver?->id : null,
                    'stock'             => $item['stock'],
                    'is_active'         => true,
                ]
            );
        }
    }
}

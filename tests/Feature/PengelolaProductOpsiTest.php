<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PengelolaProductOpsiTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::factory()->create(['role' => 'admin_pengelola', 'email_verified_at' => now()]);
    }

    private function enableCatalogFeature(): void
    {
        // Bypass fitur + permission middleware agar fokus pada logika controller.
        $this->withoutMiddleware([
            \App\Http\Middleware\EnsureFeatureEnabled::class,
            \App\Http\Middleware\EnsurePermission::class,
        ]);
    }

    private function sewaCategory(): ProductCategory
    {
        $parent = ProductCategory::create(['slug' => 'sewa-fasilitas', 'name' => 'Sewa Fasilitas', 'is_active' => true]);
        return ProductCategory::create(['slug' => 'ruang-meeting', 'name' => 'Ruang Meeting', 'parent_id' => $parent->id, 'is_active' => true]);
    }

    public function test_pengelola_can_store_product_with_cost_price_and_opsi(): void
    {
        $category = $this->sewaCategory();
        $user = $this->user();

        $payload = [
            'name' => 'Aula Test',
            'category_id' => $category->id,
            'base_price' => 500000,
            'cost_price' => 200000,
            'operational_days' => [1, 2, 3, 4, 5],
            'operational_start' => '08:00',
            'operational_end' => '16:00',
            'satuan' => 'hari',
            'capacity' => 100,
            'location' => 'Gedung A',
            'opsi' => [
                [
                    'id' => null,
                    'jenis' => 'termasuk',
                    'nama' => 'Proyektor',
                    'deskripsi' => null,
                    'harga' => 0,
                    'satuan' => 'flat',
                    'qty_min' => 1,
                    'qty_max' => null,
                    'stok' => null,
                    'aktif' => true,
                    'urutan' => 0,
                ],
                [
                    'id' => null,
                    'jenis' => 'addon',
                    'nama' => 'Extra bangku',
                    'deskripsi' => null,
                    'harga' => 5000,
                    'satuan' => 'per_unit',
                    'qty_min' => 1,
                    'qty_max' => null,
                    'stok' => null,
                    'aktif' => true,
                    'urutan' => 1,
                ],
            ],
        ];

        $this->enableCatalogFeature();
        $response = $this->actingAs($user)->post(route('pengelola.produk.store'), $payload);
        $response->assertRedirect();

        $product = Product::latest()->first();
        $this->assertEquals(200000, $product->cost_price);
        $this->assertCount(2, $product->opsi);
        $this->assertEquals('Proyektor', $product->opsi->firstWhere('jenis', 'termasuk')->nama);
        $this->assertEquals('Extra bangku', $product->opsi->firstWhere('jenis', 'addon')->nama);
        $this->assertEquals(5000, $product->opsi->firstWhere('jenis', 'addon')->harga);
    }

    public function test_pengelola_can_update_cost_price_and_sync_opsi(): void
    {
        $category = $this->sewaCategory();
        $user = $this->user();
        $product = Product::create([
            'owner_id' => $user->id,
            'category_id' => $category->id,
            'name' => 'Aula Test',
            'slug' => 'aula-test-'.\Illuminate\Support\Str::random(6),
            'base_price' => 500000,
            'cost_price' => 100000,
            'final_price' => 500000,
            'curation_status' => 'draft',
            'is_active' => false,
        ]);

        $payload = [
            'name' => 'Aula Test Updated',
            'category_id' => $category->id,
            'base_price' => 600000,
            'cost_price' => 250000,
            'operational_days' => [1, 2, 3, 4, 5],
            'operational_start' => '08:00',
            'operational_end' => '16:00',
            'satuan' => 'hari',
            'capacity' => 120,
            'location' => 'Gedung B',
            'existing_video_path' => null,
            'opsi' => [
                [
                    'id' => null,
                    'jenis' => 'addon',
                    'nama' => 'Sound system',
                    'deskripsi' => null,
                    'harga' => 150000,
                    'satuan' => 'flat',
                    'qty_min' => 1,
                    'qty_max' => null,
                    'stok' => null,
                    'aktif' => true,
                    'urutan' => 0,
                ],
            ],
        ];

        $this->enableCatalogFeature();
        $response = $this->actingAs($user)->put(route('pengelola.produk.update', $product), $payload);
        $response->assertRedirect();

        $product->refresh();
        $this->assertEquals(250000, $product->cost_price);
        $this->assertCount(1, $product->opsi);
        $this->assertEquals('Sound system', $product->opsi->first()->nama);
        $this->assertEquals(150000, $product->opsi->first()->harga);
    }

    public function test_explicit_empty_options_removes_existing_rows(): void
    {
        $category = $this->sewaCategory();
        $user = $this->user();
        $product = Product::create([
            'owner_id' => $user->id, 'category_id' => $category->id, 'name' => 'Aula',
            'slug' => 'aula', 'base_price' => 500, 'final_price' => 500,
            'curation_status' => 'draft', 'is_active' => false,
        ]);
        $product->opsi()->create([
            'jenis' => 'addon', 'nama' => 'Kursi', 'harga' => 100, 'satuan' => 'per_unit',
            'qty_min' => 1, 'aktif' => true, 'urutan' => 0, 'sumber' => 'pengelola',
        ]);
        $this->enableCatalogFeature();
        $this->actingAs($user)->patch(route('pengelola.produk.update', $product), [
            'name' => 'Aula', 'category_id' => $category->id, 'base_price' => 500,
            'operational_days' => [1, 2, 3, 4, 5],
            'operational_start' => '08:00',
            'operational_end' => '16:00',
            'satuan' => 'hari', 'existing_video_path' => null, 'opsi_present' => '1',
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame(0, $product->opsi()->count());
    }

    public function test_form_style_string_payload_creates_then_edits_preserving_status_and_meta(): void
    {
        $category = $this->sewaCategory();
        $user = $this->user();
        $this->enableCatalogFeature();

        // Meniru Form.jsx: semua nilai dikirim FormData sebagai string, boolean '1'/'0', null dilewati.
        $row = ['id' => '', 'jenis' => 'addon', 'nama' => 'Sound', 'harga' => '150000', 'satuan' => 'flat', 'qty_min' => '1', 'aktif' => '1', 'urutan' => '0'];
        unset($row['id']);
        $this->actingAs($user)->post(route('pengelola.produk.store'), [
            'name' => 'Aula Form', 'category_id' => (string) $category->id, 'target_audience' => 'publik',
            'base_price' => '500000', 'cost_price' => '200000', 'availability_status' => 'tersedia', 'stock' => '0',
            'satuan' => 'hari', 'capacity' => '50', 'location' => 'Gedung A',
            'operational_days' => ['1', '2', '3'], 'operational_start' => '08:00', 'operational_end' => '16:00',
            'video_url' => '', 'existing_video_path' => '', 'existing_images_present' => '1',
            'opsi' => [$row],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $product = Product::where('name', 'Aula Form')->firstOrFail();
        $this->assertSame(200000, $product->cost_price);
        $this->assertSame('draft', $product->curation_status);
        $this->assertSame(1, $product->opsi()->count());

        $product->update(['curation_status' => 'rejected', 'rejection_reason' => 'Perbaiki', 'meta' => array_merge($product->meta, ['weight' => 99])]);
        $opsiId = $product->opsi()->first()->id;

        $this->actingAs($user)->patch(route('pengelola.produk.update', $product), [
            'name' => 'Aula Form 2', 'category_id' => (string) $category->id, 'base_price' => '600000', 'cost_price' => '',
            'satuan' => 'jam', 'operational_days' => ['1', '2'], 'operational_start' => '09:00', 'operational_end' => '17:00',
            'existing_video_path' => '', 'existing_images_present' => '1',
            'opsi' => [array_merge($row, ['id' => (string) $opsiId, 'harga' => '175000'])],
        ])->assertRedirect()->assertSessionHasNoErrors();

        $product->refresh();
        $this->assertSame('Aula Form 2', $product->name);
        $this->assertSame(200000, $product->cost_price);
        $this->assertSame('rejected', $product->curation_status);
        $this->assertSame('Perbaiki', $product->rejection_reason);
        $this->assertSame(99, $product->meta['weight']);
        $this->assertSame(1, $product->opsi()->count());
        $this->assertSame($opsiId, $product->opsi()->first()->id);
        $this->assertEquals(175000, $product->opsi()->first()->harga);
    }

    public function test_duplicate_opsi_nama_in_same_jenis_is_rejected(): void
    {
        $category = $this->sewaCategory();
        $user = $this->user();

        $payload = [
            'name' => 'Aula Test',
            'category_id' => $category->id,
            'base_price' => 500000,
            'operational_days' => [1, 2, 3, 4, 5],
            'operational_start' => '08:00',
            'operational_end' => '16:00',
            'satuan' => 'hari',
            'opsi' => [
                ['id' => null, 'jenis' => 'addon', 'nama' => 'Sound system', 'deskripsi' => null, 'harga' => 150000, 'satuan' => 'flat', 'qty_min' => 1, 'qty_max' => null, 'stok' => null, 'aktif' => true, 'urutan' => 0],
                ['id' => null, 'jenis' => 'addon', 'nama' => 'Sound system', 'deskripsi' => null, 'harga' => 150000, 'satuan' => 'flat', 'qty_min' => 1, 'qty_max' => null, 'stok' => null, 'aktif' => true, 'urutan' => 1],
            ],
        ];

        $this->enableCatalogFeature();
        $response = $this->actingAs($user)->post(route('pengelola.produk.store'), $payload);
        $response->assertSessionHasErrors(['opsi.1.nama']);
        $this->assertDatabaseCount('products', 0);
    }
}

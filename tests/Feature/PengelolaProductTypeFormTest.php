<?php

namespace Tests\Feature;

use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class PengelolaProductTypeFormTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private function cat(string $slug, ?int $parent = null): ProductCategory
    {
        return ProductCategory::firstOrCreate(['slug' => $slug], ['name' => $slug, 'is_active' => true, 'parent_id' => $parent]);
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => 'admin_pengelola']);
        $this->withoutVite();
        $this->seed(\Database\Seeders\UsecaseSeeder::class);
        $this->seed(\Database\Seeders\ProductCategorySeeder::class);
        $this->seed(\Database\Seeders\SettingSeeder::class);
        $this->seed(\Database\Seeders\TaxRateSeeder::class);
    }

    private function submitProduk(array $payload)
    {
        return $this->actingAs($this->admin)->post(route('pengelola.produk.store'), $payload + [
            'name' => 'Item Uji', 'base_price' => 1000, 'target_audience' => 'publik',
        ]);
    }

    public function test_produk_requires_weight_stock_and_availability(): void
    {
        $parent = $this->cat('produk-fisik');
        $sub = $this->cat('elektronik', $parent->id);

        $this->submitProduk(['category_id' => $sub->id])->assertSessionHasErrors(['weight', 'availability_status', 'stock']);
    }

    public function test_jasa_does_not_need_weight_stock_or_availability(): void
    {
        $parent = $this->cat('jasa-layanan');
        $sub = $this->cat('pengujian-lab', $parent->id);

        $this->submitProduk(['category_id' => $sub->id])->assertSessionHasNoErrors();

        $p = \App\Models\Product::where('name', 'Item Uji')->first();
        $this->assertNotNull($p);
        $this->assertSame(0, $p->stock);
        $this->assertArrayNotHasKey('weight', $p->meta ?? []);
        $this->assertArrayNotHasKey('availability_status', $p->meta ?? []);
    }

    public function test_sewa_requires_satuan_and_stores_capacity_and_location(): void
    {
        $parent = $this->cat('sewa-fasilitas');
        $sub = $this->cat('ruangan', $parent->id);

        $this->submitProduk(['category_id' => $sub->id])->assertSessionHasErrors(['satuan']);

        $this->submitProduk(['category_id' => $sub->id, 'satuan' => 'jam', 'capacity' => 50, 'location' => 'Gedung A'])
            ->assertSessionHasNoErrors();

        $p = \App\Models\Product::where('name', 'Item Uji')->first();
        $this->assertSame('jam', $p->meta['satuan']);
        $this->assertSame(50, (int) $p->meta['capacity']);
        $this->assertSame('Gedung A', $p->meta['location']);
        $this->assertArrayNotHasKey('weight', $p->meta);
    }
}

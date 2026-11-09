<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TaxRateSeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductCurationTest extends TestCase
{
    use RefreshDatabase;

    protected User $pengelola;

    protected User $adminRtpu;

    protected User $pimpinanRtpu;

    protected ProductCategory $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        $this->seed(ProductCategorySeeder::class);
        $this->seed(SettingSeeder::class);
        $this->seed(TaxRateSeeder::class);
        $this->seed(UsecaseSeeder::class);

        $this->category = ProductCategory::first() ?? ProductCategory::create([
            'name' => 'Produk Inovasi',
            'slug' => 'produk-inovasi',
        ]);

        $this->pengelola = User::factory()->create([
            'role' => 'admin_pengelola',
            'unit_name' => 'Pusat Unggulan Teknologi PNJ',
        ]);

        $this->adminRtpu = User::factory()->create([
            'role' => 'admin_rtpu',
        ]);

        $this->pimpinanRtpu = User::factory()->create([
            'role' => 'pimpinan_rtpu',
        ]);
    }

    public function test_pengelola_can_create_draft_product(): void
    {
        $response = $this->actingAs($this->pengelola)
            ->post(route('pengelola.produk.store'), [
                'category_id' => $this->category->id,
                'name' => 'Robot Pembersih Solar Panel',
                'base_price' => 15000000,
                'short_description' => 'Robot otomatis pembersih panel surya skala industri',
                'description' => 'Spesifikasi detail robot pembersih solar panel dengan sensor otomatis.',
                'stock' => 5,
            ]);

        $response->assertRedirect(route('pengelola.produk.index'));

        $product = Product::where('name', 'Robot Pembersih Solar Panel')->first();
        $this->assertNotNull($product);
        $this->assertEquals('draft', $product->curation_status);
        $this->assertFalse((bool) $product->is_active);
        $this->assertEquals($this->pengelola->id, $product->owner_id);
    }

    public function test_pengelola_can_submit_product_for_curation(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Drone Pertanian Cerdas',
            'slug' => 'drone-pertanian-cerdas',
            'base_price' => 25000000,
            'final_price' => 25000000,
            'curation_status' => 'draft',
            'is_active' => false,
        ]);

        $response = $this->actingAs($this->pengelola)
            ->post(route('pengelola.produk.submit', $product));

        $response->assertRedirect();
        $this->assertEquals('pending', $product->fresh()->curation_status);
    }

    public function test_rtpu_can_verify_pending_product_step_1(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Alat Monitoring Cuaca Mikro',
            'slug' => 'alat-monitoring-cuaca-mikro',
            'base_price' => 5000000,
            'final_price' => 5000000,
            'curation_status' => 'pending',
            'is_active' => false,
        ]);

        $indexRes = $this->actingAs($this->adminRtpu)
            ->get(route('rtpu.verify.produk'));
        $indexRes->assertStatus(200);

        $verifyRes = $this->actingAs($this->adminRtpu)
            ->patch(route('rtpu.verify.produk.verify', $product), [
                'notes' => 'Dokumen spesifikasi teknis telah lengkap dan valid.',
            ]);

        $verifyRes->assertRedirect();
        $this->assertEquals('verified', $product->fresh()->curation_status);
        $this->assertFalse((bool) $product->fresh()->is_active);
    }

    public function test_rtpu_can_reject_pending_product(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Baterai Litium Prototipe',
            'slug' => 'baterai-litium-prototipe',
            'base_price' => 3000000,
            'final_price' => 3000000,
            'curation_status' => 'pending',
            'is_active' => false,
        ]);

        $rejectRes = $this->actingAs($this->adminRtpu)
            ->patch(route('rtpu.verify.produk.reject', $product), [
                'reason' => 'Sertifikasi keamanan baterai belum dilampirkan.',
            ]);

        $rejectRes->assertRedirect();
        $freshProduct = $product->fresh();
        $this->assertEquals('rejected', $freshProduct->curation_status);
        $this->assertEquals('Sertifikasi keamanan baterai belum dilampirkan.', $freshProduct->rejection_reason);
    }

    public function test_pimpinan_can_approve_verified_product_step_2(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Turbin Angin Sumbu Vertikal',
            'slug' => 'turbin-angin-sumbu-vertikal',
            'base_price' => 45000000,
            'final_price' => 45000000,
            'curation_status' => 'verified',
            'is_active' => false,
        ]);

        $indexRes = $this->actingAs($this->pimpinanRtpu)
            ->get(route('pimpinan.verify.produk'));
        $indexRes->assertStatus(200);

        $approveRes = $this->actingAs($this->pimpinanRtpu)
            ->patch(route('pimpinan.verify.produk.approve', $product), [
                'notes' => 'Disetujui untuk dipublikasikan pada katalog resmi PNJ PRIME.',
            ]);

        $approveRes->assertRedirect();
        $freshProduct = $product->fresh();
        $this->assertEquals('approved', $freshProduct->curation_status);
        $this->assertTrue((bool) $freshProduct->is_active);
    }

    public function test_pimpinan_cannot_approve_unverified_product(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Sensor Kelembapan Tanah IoT',
            'slug' => 'sensor-kelembapan-tanah-iot',
            'base_price' => 750000,
            'final_price' => 750000,
            'curation_status' => 'draft',
            'is_active' => false,
        ]);

        $response = $this->actingAs($this->pimpinanRtpu)
            ->patch(route('pimpinan.verify.produk.approve', $product));

        $response->assertStatus(422);
    }

    public function test_public_catalog_only_shows_approved_products(): void
    {
        $draftProduct = Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Produk Masih Draft',
            'slug' => 'produk-masih-draft',
            'base_price' => 100000,
            'final_price' => 100000,
            'curation_status' => 'draft',
            'is_active' => false,
        ]);

        $verifiedProduct = Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Produk Sudah Terverifikasi RTPU',
            'slug' => 'produk-sudah-terverifikasi-rtpu',
            'base_price' => 200000,
            'final_price' => 200000,
            'curation_status' => 'verified',
            'is_active' => false,
        ]);

        $approvedProduct = Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Produk Approved Siap Jual',
            'slug' => 'produk-approved-siap-jual',
            'base_price' => 300000,
            'final_price' => 300000,
            'curation_status' => 'approved',
            'is_active' => true,
        ]);

        $response = $this->get(route('catalog.index'));
        $response->assertStatus(200);

        // Catalog show only permits approved and active products
        $this->get(route('catalog.show', $approvedProduct->slug))->assertOk();
        $this->get(route('catalog.show', $draftProduct->slug))->assertNotFound();
        $this->get(route('catalog.show', $verifiedProduct->slug))->assertNotFound();
    }
}

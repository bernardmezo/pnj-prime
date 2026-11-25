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

    public function test_rtpu_badge_counts_only_produk_unggulan_shown_on_page(): void
    {
        Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Katalog 1', 'slug' => 'katalog-1', 'base_price' => 100, 'final_price' => 100,
            'curation_status' => 'pending', 'is_active' => false,
        ]);
        Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Katalog 2', 'slug' => 'katalog-2', 'base_price' => 100, 'final_price' => 100,
            'curation_status' => 'pending', 'is_active' => false,
        ]);
        \App\Models\ProdukUnggulan::create([
            'code' => 'PU-BADGE-1', 'owner_id' => $this->pengelola->id, 'name' => 'Unggulan',
            'description' => 'D', 'researcher' => 'R', 'team' => 'T', 'category' => 'C', 'price' => 1, 'status' => 'Diajukan',
        ]);

        $this->actingAs($this->adminRtpu)
            ->get(route('rtpu.verify.produk'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('pending_counts.menunggu_rtpu_produk', 1)
                ->where('pending_counts.persetujuan_final_produk', 2)
                ->where('products.0.code', 'PU-BADGE-1'));
    }

    public function test_catalog_queue_count_matches_rtpu_layanan_and_is_distinct_from_unggulan(): void
    {
        foreach (range(1, 3) as $number) {
            Product::create([
                'category_id' => $this->category->id, 'owner_id' => $this->pengelola->id,
                'name' => "Katalog {$number}", 'slug' => "queue-katalog-{$number}",
                'base_price' => 100, 'final_price' => 100,
                'curation_status' => 'pending', 'is_active' => false,
            ]);
        }

        $this->actingAs($this->pimpinanRtpu)->get(route('pimpinan.verify.produk'))
            ->assertOk()->assertInertia(fn ($page) => $page
                ->where('pending_counts.persetujuan_final_produk', 3)->has('products', 3));
        $this->actingAs($this->adminRtpu)->get(route('rtpu.verify.produk'))
            ->assertOk()->assertInertia(fn ($page) => $page
                ->where('pending_counts.menunggu_rtpu_produk', 0)->has('products', 0));
        $this->get(route('rtpu.verify.layanan'))
            ->assertOk()->assertInertia(fn ($page) => $page
                ->where('pending_counts.menunggu_verifikasi', 3)->has('antrean', 3));

        $buyer = User::factory()->create(['role' => 'customer']);
        \App\Models\Pengajuan::create([
            'code' => 'QUEUE-INVOICE', 'buyer_id' => $buyer->id, 'tipe' => 'jasa',
            'status' => 'Menunggu Invoice', 'total' => 0,
        ]);
        $this->get(route('rtpu.verify.layanan'))
            ->assertOk()->assertInertia(fn ($page) => $page
                ->where('pending_counts.menunggu_verifikasi', 4)->has('antrean', 4));
    }

    public function test_cost_price_is_available_to_reviewers_but_hidden_from_default_serialization(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Produk Uji Harga Modal',
            'slug' => 'produk-uji-harga-modal',
            'base_price' => 500000,
            'cost_price' => 200000,
            'final_price' => 500000,
            'curation_status' => 'pending',
            'is_active' => false,
        ]);

        $this->assertArrayNotHasKey('cost_price', $product->toArray());

        // Produk katalog hanya diperiksa Pimpinan pada tahap persetujuan final.
        // RTPU memverifikasi Produk Unggulan, bukan Product katalog, sehingga
        // cost_price tidak dikirim pada halaman RTPU.
        $this->actingAs($this->pimpinanRtpu)
            ->get(route('pimpinan.verify.produk'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('products.0.cost_price', 200000));
    }

    public function test_pimpinan_can_reject_verified_product_step_2(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Produk Uji Penolakan',
            'slug' => 'produk-uji-penolakan',
            'base_price' => 300000,
            'final_price' => 300000,
            'curation_status' => 'verified',
            'is_active' => false,
        ]);

        $this->actingAs($this->pimpinanRtpu)
            ->patch(route('pimpinan.verify.produk.reject', $product->id), [
                'catatan' => 'Deskripsi produk belum lengkap.',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $product->refresh();
        $this->assertSame('rejected', $product->curation_status);
        $this->assertFalse((bool) $product->is_active);
        $this->assertSame('Deskripsi produk belum lengkap.', $product->rejection_reason);
    }

    public function test_pimpinan_reject_requires_reason(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'owner_id' => $this->pengelola->id,
            'name' => 'Produk Uji Tanpa Alasan',
            'slug' => 'produk-uji-tanpa-alasan',
            'base_price' => 300000,
            'final_price' => 300000,
            'curation_status' => 'verified',
            'is_active' => false,
        ]);

        $this->actingAs($this->pimpinanRtpu)
            ->patch(route('pimpinan.verify.produk.reject', $product->id), [])
            ->assertSessionHasErrors('catatan');

        $this->assertSame('verified', $product->fresh()->curation_status);
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
                'availability_status' => 'tersedia',
                'weight' => 500,
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

    public function test_rtpu_can_verify_produk_unggulan_step_1(): void
    {
        $produk = \App\Models\ProdukUnggulan::create([
            'code' => 'PU-TEST-001',
            'owner_id' => $this->pengelola->id,
            'name' => 'Produk Unggulan Uji Verifikasi',
            'description' => 'Produk unggulan hasil penelitian P3M',
            'researcher' => 'Dr. Peneliti Utama',
            'team' => 'Tim Inovasi A',
            'category' => 'Teknologi',
            'price' => 5000000,
            'status' => 'Diajukan',
        ]);

        $indexRes = $this->actingAs($this->adminRtpu)
            ->get(route('rtpu.verify.produk'));
        $indexRes->assertStatus(200);

        $verifyRes = $this->actingAs($this->adminRtpu)
            ->patch(route('rtpu.verify.produk.verify', $produk), [
                'notes' => 'Dokumen proposal telah lengkap dan valid.',
            ]);

        $verifyRes->assertRedirect();
        $this->assertEquals('Disetujui', $produk->fresh()->status);
    }

    public function test_rtpu_can_rejectproduk_unggulan(): void
    {
        $produk = \App\Models\ProdukUnggulan::create([
            'code' => 'PU-TEST-002',
            'owner_id' => $this->pengelola->id,
            'name' => 'Produk Unggulan Uji Tolak',
            'description' => 'Produk unggulan untuk testing penolakan',
            'researcher' => 'Dr. Peneliti Kedua',
            'team' => 'Tim Inovasi B',
            'category' => 'Teknologi',
            'price' => 3000000,
            'status' => 'Diajukan',
        ]);

        $rejectRes = $this->actingAs($this->adminRtpu)
            ->patch(route('rtpu.verify.produk.reject', $produk), [
                'reason' => 'Dokumen pendukung hasil uji belum dilampirkan.',
            ]);

        $rejectRes->assertRedirect();
        $this->assertEquals('Ditolak', $produk->fresh()->status);
        $this->assertEquals('Dokumen pendukung hasil uji belum dilampirkan.', $produk->fresh()->catatan);
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

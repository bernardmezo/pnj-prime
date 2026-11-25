<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RtpuLayananEditPreservationTest extends TestCase
{
    use RefreshDatabase;

    public function test_editing_subcategory_preserves_existing_details_and_media(): void
    {
        $this->withoutVite();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $owner = User::factory()->create(['role' => 'admin_jurusan']);
        $parent = ProductCategory::create(['name' => 'Sewa', 'slug' => 'sewa-fasilitas']);
        $category = ProductCategory::create(['name' => 'Aula', 'slug' => 'aula', 'parent_id' => $parent->id]);
        $product = Product::create([
            'name' => 'Aula', 'slug' => 'aula', 'category_id' => $category->id,
            'owner_id' => $owner->id, 'base_price' => 1000, 'final_price' => 1000,
            'short_description' => 'Ringkas', 'description' => 'Deskripsi lengkap',
            'thumbnail' => 'products/main.jpg', 'images' => ['products/gallery.jpg'],
            'video_path' => 'products/videos/video.mp4', 'video_url' => 'https://example.com/video',
            'curation_status' => 'approved', 'is_active' => true,
            'meta' => ['weight' => 700, 'status_history' => [['from' => 'pending']], 'location' => 'Gedung A', 'satuan' => 'jam'],
        ]);

        $this->actingAs($admin)->get(route('rtpu.layanan.edit', $product))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Rtpu/Layanan/Form')->where('tipe', 'ruangan')
            ->where('initial.images.0', 'products/gallery.jpg')->where('initial.video_path', 'products/videos/video.mp4'));
        $this->actingAs($admin)->patch(route('rtpu.layanan.update', $product), [
            'tipe' => 'ruangan', 'name' => 'Aula diperbarui', 'desc' => 'Ringkas', 'price' => 1000,
            'location' => 'Gedung B', 'satuan' => 'jam', 'photo' => null, 'active' => true,
        ])->assertRedirect(route('rtpu.layanan'))->assertSessionHasNoErrors();
        $product->refresh();
        $this->assertSame('Deskripsi lengkap', $product->description);
        $this->assertSame(700, $product->meta['weight']);
        $this->assertSame([['from' => 'pending']], $product->meta['status_history']);
        $this->assertSame('Gedung B', $product->meta['location']);
        $this->assertSame(['products/gallery.jpg'], $product->images);
        $this->assertSame('products/videos/video.mp4', $product->video_path);
        $this->assertSame('approved', $product->curation_status);
    }

    public function test_edit_page_exposes_pengelola_product_details(): void
    {
        $this->withoutVite();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $owner = User::factory()->create(['role' => 'admin_jurusan']);
        $parent = ProductCategory::create(['name' => 'Produk Fisik', 'slug' => 'produk-fisik']);
        $category = ProductCategory::create(['name' => 'Alat', 'slug' => 'alat', 'parent_id' => $parent->id]);
        $product = Product::create([
            'name' => 'Alat', 'slug' => 'alat', 'category_id' => $category->id,
            'owner_id' => $owner->id, 'base_price' => 1500, 'final_price' => 2000,
            'target_audience' => 'internal_pnj', 'description' => 'Rincian lengkap',
            'curation_status' => 'approved', 'is_active' => true,
            'meta' => ['availability_status' => 'preorder', 'preorder_duration' => '7 hari', 'weight' => 700, 'length' => 20, 'width' => 10, 'height' => 5],
        ]);

        $this->actingAs($admin)->get(route('rtpu.layanan.edit', $product))->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('tipe', 'produk')->where('initial.category_name', 'Alat')
            ->where('initial.category_parent_name', 'Produk Fisik')->where('initial.target_audience', 'internal_pnj')
            ->where('initial.description', 'Rincian lengkap')->where('initial.availability_status', 'preorder')
            ->where('initial.preorder_duration', '7 hari')->where('initial.weight', 700)
            ->where('initial.length', 20)->where('initial.width', 10)->where('initial.height', 5));
    }
}

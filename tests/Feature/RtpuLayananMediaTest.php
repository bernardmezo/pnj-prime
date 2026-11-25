<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class RtpuLayananMediaTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_preserves_media_and_rejects_foreign_paths(): void
    {
        Storage::fake('public');
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $category = ProductCategory::create(['name' => 'Jasa', 'slug' => 'jasa-layanan']);
        $product = Product::create(['name' => 'Media', 'slug' => 'media', 'category_id' => $category->id, 'owner_id' => $admin->id, 'base_price' => 100, 'final_price' => 100, 'images' => ['products/owned.jpg'], 'video_path' => 'products/videos/old.mp4', 'video_url' => 'https://example.com/old', 'curation_status' => 'approved', 'is_active' => true]);
        $option = $product->opsi()->create(['jenis' => 'addon', 'nama' => 'Tambahan', 'satuan' => 'flat', 'foto' => 'products/opsi/old.jpg', 'sumber' => 'admin']);
        $payload = ['tipe' => 'jasa', 'name' => 'Media', 'price' => 100, 'opsi' => [['id' => $option->id, 'jenis' => 'addon', 'nama' => 'Tambahan', 'satuan' => 'flat']]];
        $this->actingAs($admin)->patch(route('rtpu.layanan.update', $product), $payload)->assertSessionHasNoErrors();
        $this->assertSame(['products/owned.jpg'], $product->refresh()->images);
        $this->assertSame('products/videos/old.mp4', $product->video_path);
        $this->assertSame('products/opsi/old.jpg', $option->refresh()->foto);
        $this->actingAs($admin)->patch(route('rtpu.layanan.update', $product), $payload + ['existing_images' => ['products/foreign.jpg']])->assertSessionHasErrors('existing_images');
        $this->actingAs($admin)->patch(route('rtpu.layanan.update', $product), array_replace_recursive($payload, ['opsi' => [['foto' => 'products/foreign.jpg']]]))->assertSessionHasErrors('opsi.0.foto');
        $this->assertSame('products/opsi/old.jpg', $option->refresh()->foto);
    }

    public function test_create_saves_gallery_video_and_option_photo(): void
    {
        Storage::fake('public');
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        ProductCategory::create(['name' => 'Jasa', 'slug' => 'jasa-layanan']);
        $this->actingAs($admin)->post(route('rtpu.layanan.store'), [
            'tipe' => 'jasa', 'name' => 'Media', 'price' => 100,
            'images' => [UploadedFile::fake()->image('gallery.jpg')],
            'video_url' => 'https://example.com/video',
            'opsi' => [['jenis' => 'addon', 'nama' => 'Tambahan', 'satuan' => 'flat', 'foto' => UploadedFile::fake()->image('addon.jpg')]],
        ])->assertSessionHasNoErrors();
        $product = Product::where('name', 'Media')->firstOrFail();
        $this->assertSame('https://example.com/video', $product->video_url);
        Storage::disk('public')->assertExists($product->images[0]);
        Storage::disk('public')->assertExists($product->opsi()->firstOrFail()->foto);
    }
}

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

class RtpuLayananUploadRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_uploaded_photo_replaces_thumbnail_without_erasing_unsubmitted_fields(): void
    {
        Storage::fake('public');
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $category = ProductCategory::create(['name' => 'Jasa', 'slug' => 'jasa-layanan']);
        $product = Product::create([
            'name' => 'Jasa', 'slug' => 'jasa-test', 'category_id' => $category->id,
            'owner_id' => $admin->id, 'base_price' => 100, 'final_price' => 200,
            'stock' => 7, 'thumbnail' => 'products/old.jpg', 'is_active' => true,
            'curation_status' => 'approved', 'meta' => ['operational_days' => [1, 2]],
        ]);

        $this->actingAs($admin)->post(route('rtpu.layanan.update', $product), [
            '_method' => 'PATCH', 'tipe' => 'jasa', 'name' => 'Jasa', 'price' => 200,
            'active' => '1', 'photo' => UploadedFile::fake()->image('new.jpg'),
        ])->assertRedirect(route('rtpu.layanan'))->assertSessionHasNoErrors();

        $product->refresh();
        Storage::disk('public')->assertExists($product->thumbnail);
        $this->assertNotSame('products/old.jpg', $product->thumbnail);
        $this->assertSame(100, $product->base_price);
        $this->assertSame(200, $product->final_price);
        $this->assertSame(7, $product->stock);
        $this->assertSame([1, 2], $product->meta['operational_days']);
        $this->assertSame('approved', $product->curation_status);
    }
}

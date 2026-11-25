<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RtpuLayananParityTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_saves_parity_fields_without_losing_metadata_or_approval(): void
    {
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $root = ProductCategory::create(['name' => 'Produk', 'slug' => 'produk-fisik']);
        $category = ProductCategory::create(['name' => 'Alat', 'slug' => 'alat', 'parent_id' => $root->id]);
        $product = Product::create(['name' => 'Alat', 'slug' => 'alat-test', 'category_id' => $root->id, 'owner_id' => $admin->id, 'base_price' => 100, 'final_price' => 200, 'curation_status' => 'pending', 'is_active' => true, 'meta' => ['status_history' => [['from' => 'draft']]]]);
        $this->actingAs($admin)->patch(route('rtpu.layanan.update', $product), [
            'tipe' => 'produk', 'name' => 'Alat', 'price' => 300, 'category_id' => $category->id,
            'target_audience' => 'internal_pnj', 'description' => 'Lengkap', 'availability_status' => 'preorder',
            'preorder_duration' => '7 hari', 'weight' => 500, 'length' => 20, 'width' => 10, 'height' => 5,
        ])->assertSessionHasNoErrors();
        $product->refresh();
        $this->assertSame($category->id, $product->category_id);
        $this->assertSame('internal_pnj', $product->target_audience);
        $this->assertSame('Lengkap', $product->description);
        $this->assertEquals(500, $product->meta['weight']);
        $this->assertSame('preorder', $product->meta['availability_status']);
        $this->assertSame([['from' => 'draft']], $product->meta['status_history']);
        $this->assertSame('pending', $product->curation_status);
        $this->assertSame(100, $product->base_price);
        $this->assertSame(300, $product->final_price);
    }
}

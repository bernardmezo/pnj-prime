<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogCategoryFilterTest extends TestCase
{
    use RefreshDatabase;

    public function test_parent_and_child_filters_and_duplicate_names(): void
    {
        $this->withoutVite();
        $customer = User::factory()->customer()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $product = ProductCategory::create(['name' => 'Produk Fisik', 'slug' => 'produk-fisik', 'is_active' => true]);
        $service = ProductCategory::create(['name' => 'Jasa / Layanan', 'slug' => 'jasa-layanan', 'is_active' => true]);
        $a = ProductCategory::create(['name' => 'Lainnya', 'slug' => 'lainnya-produk', 'parent_id' => $product->id, 'is_active' => true]);
        $b = ProductCategory::create(['name' => 'Lainnya', 'slug' => 'lainnya-jasa', 'parent_id' => $service->id, 'is_active' => true]);
        foreach ([$a, $b] as $i => $category) {
            Product::create(['name' => 'Item '.$i, 'slug' => 'item-'.$i, 'owner_id' => $owner->id, 'category_id' => $category->id, 'base_price' => 100, 'final_price' => 100, 'curation_status' => 'approved', 'is_active' => true, 'target_audience' => 'publik']);
        }
        $home = $this->actingAs($customer)->get('/')->assertOk();
        $labels = collect($home->inertiaProps('categories'))->pluck('display_name', 'slug');
        $this->assertArrayNotHasKey('lainnya-produk', $labels->all());
        $this->assertArrayNotHasKey('lainnya-jasa', $labels->all());
        foreach (['produk-fisik', 'lainnya-produk'] as $slug) {
            $response = $this->actingAs($customer)->get('/katalog?category='.$slug)->assertOk();
            $this->assertSame(['Item 0'], collect($response->inertiaProps('products.data'))->pluck('name')->all());
        }
        $response = $this->actingAs($customer)->get('/katalog?category=lainnya-jasa')->assertOk();
        $this->assertSame(['Item 1'], collect($response->inertiaProps('products.data'))->pluck('name')->all());
    }
}

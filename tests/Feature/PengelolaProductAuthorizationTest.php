<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PengelolaProductAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_jurusan_can_edit_and_submit_own_product_but_not_another_users_product(): void
    {
        $this->withoutVite();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();

        $owner = User::factory()->create(['role' => 'admin_jurusan']);
        $other = User::factory()->create(['role' => 'admin_jurusan']);
        $category = ProductCategory::create(['name' => 'Produk', 'slug' => 'produk']);
        $product = Product::create([
            'name' => 'Produk sendiri', 'slug' => 'produk-sendiri', 'category_id' => $category->id,
            'owner_id' => $owner->id, 'base_price' => 1000, 'final_price' => 1000,
            'curation_status' => 'draft', 'is_active' => false,
        ]);
        $foreign = Product::create([
            'name' => 'Produk lain', 'slug' => 'produk-lain', 'category_id' => $category->id,
            'owner_id' => $other->id, 'base_price' => 1000, 'final_price' => 1000,
            'curation_status' => 'draft', 'is_active' => false,
        ]);

        $this->actingAs($owner)->get(route('pengelola.produk.edit', $product))->assertOk();
        $this->actingAs($owner)->get(route('pengelola.produk.edit', $foreign))->assertForbidden();
        $this->actingAs($owner)->post(route('pengelola.produk.submit', $foreign))->assertForbidden();
        $this->actingAs($owner)->post(route('pengelola.produk.submit', $product))->assertRedirect();
        $this->assertSame('pending', $product->fresh()->curation_status);
    }
}

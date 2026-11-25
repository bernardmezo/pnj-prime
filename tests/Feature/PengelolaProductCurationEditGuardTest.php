<?php

namespace Tests\Feature;

use App\Http\Middleware\EnsureFeatureEnabled;
use App\Http\Middleware\EnsurePermission;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PengelolaProductCurationEditGuardTest extends TestCase
{
    use RefreshDatabase;

    public function test_edit_form_is_not_offered_when_update_is_blocked(): void
    {
        $this->withoutVite();
        $this->withoutMiddleware([EnsureFeatureEnabled::class, EnsurePermission::class]);
        $owner = User::factory()->create(['role' => 'admin_pengelola', 'email_verified_at' => now()]);
        $category = ProductCategory::create(['name' => 'Produk', 'slug' => 'produk']);
        $product = Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Produk', 'slug' => 'produk', 'base_price' => 1000, 'final_price' => 1000, 'curation_status' => 'draft']);

        foreach (['draft', 'rejected', 'approved'] as $status) {
            $product->update(['curation_status' => $status]);
            $this->actingAs($owner)->get(route('pengelola.produk.edit', $product))->assertOk();
        }
        foreach (['pending', 'verified', 'perlu_revisi_harga', 'counter_offer'] as $status) {
            $product->update(['curation_status' => $status]);
            $this->actingAs($owner)->get(route('pengelola.produk.edit', $product))->assertRedirect(route('pengelola.produk.index'))->assertSessionHas('error');
            $this->actingAs($owner)->patch(route('pengelola.produk.update', $product), [])->assertStatus(422);
            $this->assertSame($status, $product->fresh()->curation_status);
        }
    }
}

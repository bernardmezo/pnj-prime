<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PengelolaProductEditPreservationTest extends TestCase
{
    use RefreshDatabase;

    public function test_duplicate_options_do_not_partially_save_price(): void
    {
        $this->withoutMiddleware([\App\Http\Middleware\EnsureFeatureEnabled::class, \App\Http\Middleware\EnsurePermission::class]);
        $user = User::factory()->create(['role' => 'admin_pengelola', 'email_verified_at' => now()]);
        $parent = ProductCategory::create(['slug' => 'sewa-fasilitas', 'name' => 'Sewa', 'is_active' => true]);
        $category = ProductCategory::create(['slug' => 'ruang', 'name' => 'Ruang', 'parent_id' => $parent->id, 'is_active' => true]);
        $product = Product::create(['owner_id' => $user->id, 'category_id' => $category->id, 'name' => 'Ruang', 'slug' => 'ruang', 'base_price' => 100, 'final_price' => 100, 'curation_status' => 'draft']);
        $row = ['jenis' => 'addon', 'nama' => 'Kursi', 'harga' => 5000, 'satuan' => 'flat'];
        $this->actingAs($user)->patch(route('pengelola.produk.update', $product), [
            'name' => 'Baru', 'category_id' => $category->id, 'base_price' => 200,
            'satuan' => 'hari', 'operational_days' => [1], 'operational_start' => '08:00', 'operational_end' => '16:00', 'opsi' => [$row, $row],
        ])->assertSessionHasErrors('opsi.1.nama');
        $this->assertSame(100, $product->fresh()->base_price);
    }

    public function test_approved_edit_preserves_publication_media_options_and_metadata(): void
    {
        $this->withoutVite();
        $this->withoutMiddleware([\App\Http\Middleware\EnsureFeatureEnabled::class, \App\Http\Middleware\EnsurePermission::class]);
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $other = User::factory()->create(['role' => 'admin_pengelola']);
        $parent = ProductCategory::create(['slug' => 'sewa-fasilitas', 'name' => 'Sewa', 'is_active' => true]);
        $category = ProductCategory::create(['slug' => 'ruang', 'name' => 'Ruang', 'parent_id' => $parent->id, 'is_active' => true]);
        $meta = ['satuan' => 'jam', 'capacity' => 50, 'location' => 'A', 'operational_days' => [2, 3], 'operational_start' => '09:00', 'operational_end' => '17:00', 'custom' => 'preserved'];
        $product = Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Ruang', 'slug' => 'ruang', 'base_price' => 100, 'final_price' => 150, 'thumbnail' => 'products/cover.jpg', 'images' => ['products/a.jpg'], 'video_path' => 'products/a.mp4', 'curation_status' => 'approved', 'is_active' => true, 'approved_by' => $owner->id, 'approved_at' => now(), 'meta' => $meta]);
        $option = $product->opsi()->create(['jenis' => 'addon', 'nama' => 'Kursi', 'harga' => 5000, 'satuan' => 'flat', 'foto' => 'products/opsi/a.jpg', 'sumber' => 'pengelola']);
        $payload = ['name' => 'Ruang baru', 'category_id' => $category->id, 'base_price' => 200, 'satuan' => 'jam', 'operational_days' => [2, 3], 'operational_start' => '09:00', 'operational_end' => '17:00'];
        $this->actingAs($other)->get(route('pengelola.produk.edit', $product))->assertForbidden();
        $this->actingAs($other)->patch(route('pengelola.produk.update', $product), $payload)->assertForbidden();
        $this->actingAs($owner)->patch(route('pengelola.produk.update', $product), $payload)->assertRedirect()->assertSessionHasNoErrors();
        $product->refresh();
        $this->assertSame('approved', $product->curation_status);
        $this->assertTrue($product->is_active);
        $this->assertSame($owner->id, $product->approved_by);
        $this->assertNotNull($product->approved_at);
        $this->assertSame($meta, $product->meta);
        $this->assertSame('products/cover.jpg', $product->thumbnail);
        $this->assertSame(['products/a.jpg'], $product->images);
        $this->assertSame('products/a.mp4', $product->video_path);
        $this->assertSame('products/opsi/a.jpg', $option->fresh()->foto);
        $this->assertCount(1, $product->opsi);
        $this->assertSame(200, $product->final_price);
        $this->get(route('catalog.show', $product->slug))->assertOk()->assertSee('Ruang baru');
    }

    public function test_partial_edit_preserves_unsubmitted_data_and_status(): void
    {
        $this->withoutMiddleware([\App\Http\Middleware\EnsureFeatureEnabled::class, \App\Http\Middleware\EnsurePermission::class]);
        $user = User::factory()->create(['role' => 'admin_pengelola', 'email_verified_at' => now()]);
        $parent = ProductCategory::create(['slug' => 'sewa-fasilitas', 'name' => 'Sewa', 'is_active' => true]);
        $category = ProductCategory::create(['slug' => 'ruang', 'name' => 'Ruang', 'parent_id' => $parent->id, 'is_active' => true]);
        $meta = ['weight' => 1234, 'status_history' => [['to' => 'rejected']], 'satuan' => 'jam', 'capacity' => 50, 'location' => 'A', 'operational_days' => [2, 3], 'operational_start' => '09:00', 'operational_end' => '17:00'];
        $product = Product::create(['owner_id' => $user->id, 'category_id' => $category->id, 'name' => 'Ruang', 'slug' => 'ruang', 'base_price' => 100, 'cost_price' => 80, 'final_price' => 100, 'short_description' => 'Ringkas', 'description' => 'Panjang', 'images' => ['products/a.jpg'], 'video_path' => 'products/a.mp4', 'video_url' => 'https://example.com/video', 'curation_status' => 'rejected', 'rejection_reason' => 'Perbaiki', 'meta' => $meta]);

        $this->actingAs($user)->patch(route('pengelola.produk.update', $product), [
            'name' => 'Ruang baru', 'category_id' => $category->id, 'base_price' => 200,
            'satuan' => 'jam', 'operational_days' => [2, 3], 'operational_start' => '09:00', 'operational_end' => '17:00',
        ])->assertRedirect(route('pengelola.produk.index'))->assertSessionHasNoErrors();

        $product->refresh();
        $this->assertSame  (200, $product->base_price);
        $this->assertSame(80, $product->cost_price);
        $this->assertSame('Ringkas', $product->short_description);
        $this->assertSame('Panjang', $product->description);
        $this->assertSame(['products/a.jpg'], $product->images);
        $this->assertSame('products/a.mp4', $product->video_path);
        $this->assertSame('https://example.com/video', $product->video_url);
        $this->assertSame('rejected', $product->curation_status);
        $this->assertSame('Perbaiki', $product->rejection_reason);
        $this->assertSame($meta, $product->meta);
    }
}

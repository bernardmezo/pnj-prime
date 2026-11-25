<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RtpuLayananNonMediaRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_and_edit_preserve_non_media_fields_for_each_type(): void
    {
        $this->withoutVite();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $this->actingAs($admin);

        foreach (['jasa' => 'jasa-layanan', 'ruangan' => 'sewa-fasilitas', 'produk' => 'produk-fisik'] as $type => $slug) {
            $root = ProductCategory::create(['name' => $type, 'slug' => $slug]);
            $child = ProductCategory::create(['name' => "Sub $type", 'slug' => "sub-$type", 'parent_id' => $root->id]);
            $payload = [
                'tipe' => $type, 'name' => "Layanan $type", 'category_id' => $child->id,
                'target_audience' => 'internal_pnj', 'description' => 'Deskripsi lengkap',
                'price' => 300, 'active' => false,
            ] + ($type === 'produk'
                ? ['availability_status' => 'preorder', 'preorder_duration' => '7 hari', 'weight' => 500, 'length' => 20, 'width' => 10, 'height' => 5, 'stock' => 4, 'category' => 'Alat', 'specs' => 'Detail']
                : ['location' => 'Gedung A', 'operational_days' => [1, 3], 'operational_start' => '08:00', 'operational_end' => '16:00'] + ($type === 'ruangan' ? ['satuan' => 'jam', 'capacity' => 20, 'facilities' => 'AC'] : []));

            $this->post(route('rtpu.layanan.store'), $payload)->assertRedirect(route('rtpu.layanan'))->assertSessionHasNoErrors();
            $product = Product::where('name', "Layanan $type")->firstOrFail();
            $this->assertSame($child->id, $product->category_id);
            $this->assertFalse((bool) $product->is_active);
            $this->assertSame('approved', $product->curation_status);
            $this->assertSame('internal_pnj', $product->target_audience);
            $this->assertSame('Deskripsi lengkap', $product->description);
            foreach (array_intersect_key($payload, array_flip(['availability_status', 'preorder_duration', 'weight', 'length', 'width', 'height', 'location', 'operational_days', 'operational_start', 'operational_end', 'satuan', 'capacity', 'facilities', 'category', 'specs'])) as $key => $value) {
                $this->assertEquals($value, $product->meta[$key], "$type create $key");
            }
            $this->get(route('rtpu.layanan.edit', $product))->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('Rtpu/Layanan/Form')->where('tipe', $type)->where('initial.category_id', $child->id)
                ->where('initial.status', 'Nonaktif')->where('initial.target_audience', 'internal_pnj'));
            $payload['active'] = true;
            $payload['description'] = 'Diperbarui';
            $this->patch(route('rtpu.layanan.update', $product), $payload)->assertRedirect(route('rtpu.layanan'))->assertSessionHasNoErrors();
            $product->refresh();
            $this->assertTrue((bool) $product->is_active);
            $this->assertSame('approved', $product->curation_status);
            $this->assertSame('Diperbarui', $product->description);
            foreach (array_intersect_key($payload, array_flip(['availability_status', 'preorder_duration', 'weight', 'length', 'width', 'height', 'location', 'operational_days', 'operational_start', 'operational_end', 'satuan', 'capacity', 'facilities', 'category', 'specs'])) as $key => $value) {
                $this->assertEquals($value, $product->meta[$key], "$type update $key");
            }
        }
    }

    public function test_create_and_update_reject_cross_type_categories_and_invalid_metadata(): void
    {
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $this->actingAs($admin);
        $jasa = ProductCategory::create(['name' => 'Jasa', 'slug' => 'jasa-layanan']);
        $produk = ProductCategory::create(['name' => 'Produk', 'slug' => 'produk-fisik']);
        $product = Product::create(['name' => 'Uji', 'slug' => 'uji', 'category_id' => $jasa->id, 'owner_id' => $admin->id, 'base_price' => 100, 'final_price' => 100, 'curation_status' => 'approved', 'is_active' => true]);
        $base = ['tipe' => 'jasa', 'name' => 'Uji', 'price' => 100];
        foreach ([['category_id' => $produk->id], ['operational_days' => [1, 1]], ['operational_start' => '12:00', 'operational_end' => '11:00'], ['active' => 'invalid']] as $invalid) {
            $field = array_key_first($invalid);
            if ($field === 'operational_days') $field = 'operational_days.0';
            if ($field === 'operational_start') $field = 'operational_end';
            $this->post(route('rtpu.layanan.store'), $base + $invalid)->assertSessionHasErrors($field);
            $this->patch(route('rtpu.layanan.update', $product), $base + $invalid)->assertSessionHasErrors($field);
        }
        $this->patch(route('rtpu.layanan.update', $product), ['tipe' => 'produk', 'name' => 'Uji', 'price' => 100])->assertSessionHasErrors('tipe');
        $this->assertSame($jasa->id, $product->fresh()->category_id);
    }

    public function test_rental_unit_is_required_on_both_create_and_edit(): void
    {
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $this->actingAs($admin);
        $category = ProductCategory::create(['name' => 'Sewa', 'slug' => 'sewa-fasilitas']);
        $product = Product::create(['name' => 'Aula', 'slug' => 'aula-unit', 'category_id' => $category->id, 'owner_id' => $admin->id, 'base_price' => 100, 'final_price' => 100, 'curation_status' => 'approved', 'is_active' => true, 'meta' => ['satuan' => 'jam']]);
        $payload = ['tipe' => 'ruangan', 'name' => 'Aula', 'price' => 100, 'satuan' => null];
        $this->post(route('rtpu.layanan.store'), $payload)->assertSessionHasErrors('satuan');
        $this->patch(route('rtpu.layanan.update', $product), $payload)->assertSessionHasErrors('satuan');
    }
}

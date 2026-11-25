<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_category_parent_is_exposed_and_updated_without_losing_other_data(): void
    {
        $this->seed(UsecaseSeeder::class);
        $this->withoutVite();
        $admin = User::factory()->create(['role' => 'super_admin']);
        $parent = ProductCategory::create(['name' => 'Produk', 'slug' => 'produk-fisik']);
        $other = ProductCategory::create(['name' => 'Jasa', 'slug' => 'jasa-layanan']);
        $child = ProductCategory::create(['name' => 'Awal', 'slug' => 'awal', 'parent_id' => $parent->id, 'description' => 'Retain me', 'icon' => 'icon', 'sort_order' => 9, 'is_active' => false]);

        $this->actingAs($admin)->get(route('superadmin.kategori.index'))
            ->assertOk()->assertInertia(fn ($page) => $page->component('SuperAdmin/Kategori/Index')
                ->where('parents.0.children.0.parent_id', $parent->id));

        $this->patch(route('superadmin.kategori.update', $child), [
            'name' => 'Baru', 'parent_id' => $other->id, 'sort_order' => 12, 'is_active' => false,
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertDatabaseHas('product_categories', ['id' => $child->id, 'parent_id' => $other->id, 'name' => 'Baru', 'slug' => 'baru', 'description' => 'Retain me', 'icon' => 'icon', 'is_active' => false]);
    }

    public function test_create_toggle_and_root_protection(): void
    {
        $this->seed(UsecaseSeeder::class);
        $admin = User::factory()->create(['role' => 'super_admin']);
        $parent = ProductCategory::create(['name' => 'Produk', 'slug' => 'produk-fisik']);
        $this->actingAs($admin)->post(route('superadmin.kategori.store'), ['name' => 'Anak', 'parent_id' => $parent->id, 'sort_order' => 7])
            ->assertRedirect()->assertSessionHasNoErrors();
        $child = ProductCategory::where('slug', 'anak')->firstOrFail();
        $this->assertSame($parent->id, $child->parent_id);
        $this->patch(route('superadmin.kategori.toggle', $child))->assertRedirect()->assertSessionHasNoErrors();
        $this->assertFalse($child->fresh()->is_active);
        $this->patch(route('superadmin.kategori.toggle', $child))->assertRedirect()->assertSessionHasNoErrors();
        $this->assertTrue($child->fresh()->is_active);
        $this->patch(route('superadmin.kategori.update', $parent), ['name' => 'Changed', 'parent_id' => $parent->id, 'is_active' => false])->assertSessionHasErrors('category');
        $this->patch(route('superadmin.kategori.toggle', $parent))->assertSessionHasErrors('category');
        $this->assertDatabaseHas('product_categories', ['id' => $parent->id, 'slug' => 'produk-fisik', 'name' => 'Produk']);
    }

    public function test_invalid_parents_are_rejected_and_omitted_parent_is_preserved(): void
    {
        $this->seed(UsecaseSeeder::class);
        $admin = User::factory()->create(['role' => 'super_admin']);
        $parent = ProductCategory::create(['name' => 'Tipe', 'slug' => 'tipe']);
        $child = ProductCategory::create(['name' => 'Anak', 'slug' => 'anak', 'parent_id' => $parent->id]);
        $payload = ['name' => 'Anak', 'is_active' => true];
        $this->actingAs($admin)->patch(route('superadmin.kategori.update', $child), $payload + ['parent_id' => $child->id])->assertSessionHasErrors('parent_id');
        $this->patch(route('superadmin.kategori.update', $child), $payload + ['parent_id' => 999999])->assertSessionHasErrors('parent_id');
        $this->post(route('superadmin.kategori.store'), ['name' => 'Cucu', 'parent_id' => $child->id])->assertSessionHasErrors('parent_id');
        $this->patch(route('superadmin.kategori.update', $child), $payload)->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame($parent->id, $child->fresh()->parent_id);
    }

    public function test_duplicate_generated_slug_is_rejected_without_server_error(): void
    {
        $this->seed(UsecaseSeeder::class);
        $parent = ProductCategory::create(['name' => 'Type', 'slug' => 'type']);
        ProductCategory::create(['name' => 'Existing', 'slug' => 'existing', 'parent_id' => $parent->id]);
        $admin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($admin)->post(route('superadmin.kategori.store'), [
            'name' => 'Existing', 'parent_id' => $parent->id,
        ])->assertSessionHasErrors('name');
    }
}

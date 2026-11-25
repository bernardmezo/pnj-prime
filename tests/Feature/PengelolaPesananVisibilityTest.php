<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class PengelolaPesananVisibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_paid_order_remains_visible_and_actionable_after_product_is_soft_deleted(): void
    {
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $buyer = User::factory()->customer()->create();
        $category = ProductCategory::create(['name' => 'Produk', 'slug' => 'produk-dihapus', 'is_active' => true]);
        $product = Product::create(['category_id' => $category->id, 'owner_id' => $owner->id,
            'name' => 'Produk lama', 'slug' => 'produk-lama', 'base_price' => 500, 'final_price' => 500]);
        $order = Pengajuan::create(['code' => 'TEST-DELETED', 'buyer_id' => $buyer->id,
            'product_id' => $product->id, 'tipe' => 'produk', 'jumlah' => 1,
            'total' => 500, 'metode_pengambilan' => 'Diantar', 'status' => 'Lunas']);
        $product->delete();

        $this->actingAs($owner)->get(route('pengelola.pesanan.index'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->has('pesanan', 1)->where('pesanan.0.id', $order->id)
                ->where('pesanan.0.product', 'Produk lama'));
        $this->patch(route('pengelola.pesanan.update', $order), ['status' => 'Diproses'])
            ->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Diproses', $order->fresh()->status);
    }

    public function test_paid_orders_are_visible_only_to_their_product_owner_for_both_pengelola_roles(): void
    {
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $buyer = User::factory()->customer()->create();
        $category = ProductCategory::create(['name' => 'Produk', 'slug' => 'produk-test', 'is_active' => true]);
        $owners = [
            User::factory()->create(['role' => 'admin_pengelola']),
            User::factory()->create(['role' => 'admin_jurusan']),
        ];
        $orders = [];
        foreach ($owners as $index => $owner) {
            $product = Product::create([
                'category_id' => $category->id, 'owner_id' => $owner->id,
                'name' => 'Produk '.$index, 'slug' => 'produk-'.$index,
                'base_price' => 500, 'final_price' => 500,
            ]);
            foreach (['Lunas', 'Menunggu Pembayaran'] as $status) {
                $orders[$index][$status] = Pengajuan::create([
                    'code' => 'TEST-'.$index.'-'.$status, 'buyer_id' => $buyer->id,
                    'product_id' => $product->id, 'tipe' => 'produk', 'jumlah' => 1,
                    'total' => 500, 'metode_pengambilan' => 'Diantar', 'status' => $status,
                ]);
            }
        }

        foreach ($owners as $index => $owner) {
            $this->actingAs($owner)->get(route('pengelola.pesanan.index'))
                ->assertOk()->assertInertia(fn (Assert $page) => $page
                    ->component('Pengelola/Pesanan/Index')
                    ->has('pesanan', 1)
                    ->where('pesanan.0.id', $orders[$index]['Lunas']->id)
                    ->where('pesanan.0.status', 'Lunas'));
            $this->patch(route('pengelola.pesanan.update', $orders[1 - $index]['Lunas']), ['status' => 'Diproses'])
                ->assertNotFound();
        }
        $this->actingAs($buyer)->get(route('pengelola.pesanan.index'))->assertForbidden();
    }
}

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

class RtpuPesananOwnerTest extends TestCase
{
    use RefreshDatabase;

    public function test_rtpu_pickup_and_jasa_follow_existing_paid_workflows(): void
    {
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $owner = User::factory()->create(['role' => 'admin_rtpu']);
        $buyer = User::factory()->customer()->create();
        $category = ProductCategory::create(['name' => 'Layanan', 'slug' => 'rtpu-fulfillment-test', 'is_active' => true]);
        $product = Product::create(['category_id' => $category->id, 'owner_id' => $owner->id, 'name' => 'Layanan', 'slug' => 'rtpu-fulfillment', 'base_price' => 500, 'final_price' => 500]);
        $pickup = Pengajuan::create(['code' => 'RTPU-PICKUP', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'produk', 'jumlah' => 1, 'total' => 500, 'metode_pengambilan' => 'Ambil Sendiri', 'status' => 'Lunas']);
        $jasa = Pengajuan::create(['code' => 'RTPU-JASA', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'jasa', 'jumlah' => 1, 'total' => 500, 'status' => 'Lunas']);
        $this->actingAs($owner)->patch(route('rtpu.pesanan.update', $pickup), ['status' => 'Diproses', 'pickup_action' => 'ready'])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertNotNull($pickup->fresh()->pickup_ready_at);
        $this->patch(route('rtpu.pesanan.update', $pickup), ['status' => 'Selesai'])->assertSessionHasErrors();
        $this->patch(route('rtpu.pesanan.update', $jasa), ['status' => 'Diproses'])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Diproses', $jasa->fresh()->status);
        $this->patch(route('rtpu.pesanan.update', $jasa), ['status' => 'Dikerjakan'])->assertSessionHasErrors();
    }

    public function test_rtpu_sees_and_processes_only_own_paid_orders(): void
    {
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $owner = User::factory()->create(['role' => 'admin_rtpu']);
        $other = User::factory()->create(['role' => 'admin_rtpu']);
        $buyer = User::factory()->customer()->create();
        $category = ProductCategory::create(['name' => 'Produk', 'slug' => 'rtpu-order-test', 'is_active' => true]);
        $orders = [];
        foreach ([$owner, $other] as $i => $person) {
            $product = Product::create(['category_id' => $category->id, 'owner_id' => $person->id, 'name' => 'Produk '.$i, 'slug' => 'rtpu-order-'.$i, 'base_price' => 500, 'final_price' => 500]);
            foreach (['Lunas', 'Menunggu Pembayaran'] as $status) {
                $orders[$i][$status] = Pengajuan::create(['code' => 'RTPU-'.$i.'-'.$status, 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'produk', 'jumlah' => 1, 'total' => 500, 'metode_pengambilan' => 'Diantar', 'status' => $status]);
            }
        }
        $this->actingAs($owner)->get('/rtpu/pesanan')->assertOk()->assertInertia(fn (Assert $page) => $page->component('Pengelola/Pesanan/Index')->has('pesanan', 1)->where('pesanan.0.id', $orders[0]['Lunas']->id)->where('pesananRoute', 'rtpu.pesanan.update')->where('ownerLabel', 'Admin RTPU'));
        $this->patch('/rtpu/pesanan/'.$orders[1]['Lunas']->id, ['status' => 'Diproses'])->assertNotFound();
        $this->patch('/rtpu/pesanan/'.$orders[0]['Menunggu Pembayaran']->id, ['status' => 'Diproses'])->assertSessionHasErrors();
        $this->patch('/rtpu/pesanan/'.$orders[0]['Lunas']->id, ['status' => 'Diproses'])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Diproses', $orders[0]['Lunas']->fresh()->status);
        $this->actingAs($buyer)->get('/rtpu/pesanan')->assertForbidden();
    }
}

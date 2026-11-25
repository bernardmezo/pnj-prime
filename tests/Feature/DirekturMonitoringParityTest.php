<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DirekturMonitoringParityTest extends TestCase
{
    use RefreshDatabase;

    public function test_director_sees_the_same_monitoring_and_transaction_history_as_leader(): void
    {
        $this->withoutVite();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $leader = User::factory()->create(['role' => 'pimpinan_rtpu']);
        $director = User::factory()->create(['role' => 'direktur']);
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $buyer = User::factory()->customer()->create();
        $category = ProductCategory::create(['name' => 'Produk', 'slug' => 'produk-fisik', 'is_active' => true]);
        $product = Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Produk A', 'slug' => 'produk-a', 'base_price' => 100, 'final_price' => 100, 'is_active' => true, 'curation_status' => 'approved']);
        foreach (['Lunas' => '3', 'Menunggu Pembayaran' => '9'] as $status => $quantity) {
            Pengajuan::create(['code' => 'PARITY-'.$status, 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'produk', 'jumlah' => $quantity, 'status' => $status, 'total' => 100]);
        }

        $leaderMonitor = $this->actingAs($leader)->get(route('pimpinan.monitor'))->assertOk()->inertiaProps('produk');
        $directorMonitor = $this->actingAs($director)->get(route('direktur.monitor'))->assertOk()->inertiaProps('produk');
        $this->assertEquals($leaderMonitor, $directorMonitor);
        $this->assertSame(3, $directorMonitor[0]['sold_count']);

        $leaderHistory = $this->actingAs($leader)->get(route('pimpinan.riwayat'))->assertOk()->inertiaProps('riwayat');
        $directorHistory = $this->actingAs($director)->get(route('direktur.riwayat'))->assertOk()->inertiaProps('riwayat');
        $this->assertCount(2, $directorHistory);
        $this->assertEquals($leaderHistory, $directorHistory);
        $this->assertSame($buyer->name, $directorHistory[0]['customer']);
    }
}

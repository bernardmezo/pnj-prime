<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PimpinanProductSalesTest extends TestCase
{
    use RefreshDatabase;

    public function test_pimpinan_history_matches_rtpu_transaction_history(): void
    {
        $this->withoutVite();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $leader = User::factory()->create(['role' => 'pimpinan_rtpu']);
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $buyer = User::factory()->customer()->create();
        foreach (['Diajukan', 'Lunas', 'Selesai'] as $status) {
            Pengajuan::create(['code' => 'HISTORY-'.$status, 'buyer_id' => $buyer->id, 'tipe' => 'jasa', 'status' => $status, 'total' => 100]);
        }
        $rtpu = $this->actingAs($admin)->get(route('rtpu.riwayat'))->assertOk()->inertiaProps('riwayat');
        $leaderRows = $this->actingAs($leader)->get(route('pimpinan.riwayat'))->assertOk()->inertiaProps('riwayat');
        $this->assertCount(3, $leaderRows);
        $this->assertEquals($rtpu, $leaderRows);
    }

    public function test_rentals_and_services_count_paid_requests_not_duration_or_quantity(): void
    {
        $this->withoutVite();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $leader = User::factory()->create(['role' => 'pimpinan_rtpu']);
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $buyer = User::factory()->customer()->create();
        foreach ([['sewa-fasilitas', 'ruangan', 'Sewa A', ['Lunas', 'Berjalan', 'Selesai']], ['jasa-layanan', 'jasa', 'Jasa A', ['Lunas', 'Dijadwalkan', 'Dikerjakan', 'Hasil Diunggah', 'Selesai']]] as [$slug, $type, $name, $statuses]) {
            $parent = ProductCategory::create(['name' => $name, 'slug' => $slug, 'is_active' => true]);
            $category = ProductCategory::create(['name' => 'Sub '.$name, 'slug' => 'sub-'.$slug, 'parent_id' => $parent->id, 'is_active' => true]);
            $product = Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => $name, 'slug' => $slug, 'base_price' => 100, 'final_price' => 100, 'is_active' => true, 'curation_status' => 'approved']);
            foreach ([...$statuses, 'Menunggu Pembayaran', 'Dibatalkan'] as $index => $status) {
                Pengajuan::create(['code' => $slug.'-'.$index, 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => $type, 'jumlah' => '12', 'status' => $status, 'total' => 100]);
            }
        }
        foreach (['pimpinan.monitor'] as $route) {
            $response = $this->actingAs($leader)->get(route($route))->assertOk();
            $rows = collect($response->inertiaProps('produk'))->keyBy('name');
            $this->assertSame('ruangan', $rows['Sewa A']['type']);
            $this->assertSame(3, $rows['Sewa A']['usage_count']);
            $this->assertSame('jasa', $rows['Jasa A']['type']);
            $this->assertSame(5, $rows['Jasa A']['usage_count']);
        }
    }

    public function test_monitor_and_history_show_paid_quantities_per_product_without_customer_details(): void
    {
        $this->withoutVite();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $leader = User::factory()->create(['role' => 'pimpinan_rtpu']);
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $buyer = User::factory()->customer()->create();
        $category = ProductCategory::create(['name' => 'Produk', 'slug' => 'produk-fisik', 'is_active' => true]);
        $product = Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Produk A', 'slug' => 'produk-a', 'base_price' => 100, 'final_price' => 100, 'is_active' => true, 'curation_status' => 'approved']);
        foreach (['Lunas' => '2', 'Diproses' => '3', 'Dikirim' => '4', 'Selesai' => '5', 'Menunggu Pembayaran' => '50', 'Dibatalkan' => '60'] as $status => $quantity) {
            Pengajuan::create(['code' => 'TEST-'.$status, 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'produk', 'jumlah' => $quantity, 'status' => $status, 'total' => 100]);
        }
        foreach (['pimpinan.monitor'] as $route) {
            $this->actingAs($leader)->get(route($route))->assertOk()->assertInertia(fn ($page) => $page
                ->has('produk', 1)->where('produk.0.name', 'Produk A')->where('produk.0.sold_count', 14)
                ->missing('produk.0.customer'));
        }
    }
}

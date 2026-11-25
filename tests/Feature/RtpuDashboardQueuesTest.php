<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProdukUnggulan;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RtpuDashboardQueuesTest extends TestCase
{
    use RefreshDatabase;

    public function test_report_ranks_by_request_count_including_unpaid_and_rejected_requests(): void
    {
        $this->withoutVite();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $category = ProductCategory::create(['name' => 'Uji', 'slug' => 'uji']);
        $products = [];
        foreach (['A', 'B'] as $name) {
            $products[$name] = Product::create(['category_id' => $category->id, 'owner_id' => $admin->id, 'name' => $name, 'slug' => strtolower($name), 'base_price' => 100, 'final_price' => 100, 'curation_status' => 'approved', 'is_active' => true]);
        }
        foreach ([['A', 'Ditolak', 100], ['A', 'Diajukan', 200], ['B', 'Selesai', 900]] as [$name, $status, $total]) {
            Pengajuan::create(['code' => uniqid(), 'buyer_id' => $admin->id, 'product_id' => $products[$name]->id, 'tipe' => 'produk', 'status' => $status, 'total' => $total]);
        }
        $response = $this->actingAs($admin)->get(route('rtpu.reports', ['start_date' => now()->toDateString(), 'end_date' => now()->toDateString()]))->assertOk();
        $top = $response->inertiaProps('top_services');
        $this->assertSame('A', $top[0]['name']);
        $this->assertSame(2, $top[0]['count']);
        $this->assertSame(300, $top[0]['total']);
        $this->assertSame('B', $top[1]['name']);
    }

    public function test_dashboard_counts_match_each_verification_page(): void
    {
        $this->withoutVite();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $buyer = User::factory()->create(['role' => 'customer']);
        User::factory()->create(['role' => 'admin_pengelola', 'account_status' => 'pending']);
        User::factory()->create(['role' => 'customer', 'account_status' => 'pending']);
        $category = ProductCategory::create(['name' => 'Uji', 'slug' => 'uji']);
        foreach (['pending', 'verified', 'approved'] as $status) {
            Product::create(['category_id' => $category->id, 'owner_id' => $admin->id, 'name' => $status, 'slug' => $status, 'base_price' => 100, 'final_price' => 100, 'curation_status' => $status, 'is_active' => false]);
        }
        foreach (['Diajukan', 'Menunggu Invoice', 'Selesai'] as $status) {
            Pengajuan::create(['code' => uniqid(), 'buyer_id' => $buyer->id, 'tipe' => 'produk', 'status' => $status]);
        }
        ProdukUnggulan::create(['code' => 'PU-1', 'owner_id' => $admin->id, 'name' => 'Unggulan', 'description' => 'D', 'researcher' => 'R', 'team' => 'T', 'category' => 'C', 'price' => 1, 'status' => 'Diajukan']);
        $this->actingAs($admin);
        $dashboard = $this->get(route('rtpu.dashboard'))->assertOk();
        $queues = collect($dashboard->inertiaProps('verificationQueues'))->keyBy('key');
        $this->assertSame(4, $queues['layanan']['count']);
        $this->assertSame(1, $queues['akun']['count']);
        $this->assertSame(1, $queues['produk']['count']);
        $this->assertSame(0, $queues['pembayaran']['count']);
        foreach (['layanan', 'akun', 'produk', 'pembayaran'] as $key) {
            $this->assertSame(route($queues[$key]['route']), $queues[$key]['url']);
        }
        $this->assertCount(4, $this->get(route('rtpu.verify.layanan'))->inertiaProps('antrean'));
        $this->assertCount(1, $this->get(route('rtpu.verify.akun'))->inertiaProps('pendingUsers'));
        $this->assertCount(1, $this->get(route('rtpu.verify.produk'))->inertiaProps('products'));
        $this->assertCount(0, $this->get(route('rtpu.verify.bayar'))->inertiaProps('antrean'));
    }
}

<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Pengajuan;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class DirekturDashboardTest extends TestCase
{
    use RefreshDatabase;

    private User $direktur;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(\Database\Seeders\UsecaseSeeder::class);
        User::flushPermissionCache();
        $this->direktur = User::factory()->create(['role' => 'direktur']);
    }

    private function seedSale(string $status, string $completedAt, int $subtotal = 100000, int $tax = 11000, int $qty = 2, ?ProductCategory $cat = null): Order
    {
        $cat ??= ProductCategory::firstOrCreate(['slug' => 'produk-fisik'], ['name' => 'Produk Fisik', 'is_active' => true]);
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $buyer = User::factory()->customer()->create();
        $product = Product::create([
            'category_id' => $cat->id, 'owner_id' => $owner->id, 'name' => 'Item '.uniqid(), 'slug' => uniqid('i'),
            'base_price' => $subtotal / $qty, 'final_price' => $subtotal / $qty, 'curation_status' => 'approved', 'is_active' => true,
        ]);
        $p = Pengajuan::create(['code' => uniqid('T'), 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'produk', 'status' => $status === 'selesai' ? 'Selesai' : 'Lunas', 'total' => $subtotal]);
        $order = Order::create([
            'pengajuan_id' => $p->id, 'order_number' => uniqid('ORD'), 'buyer_id' => $buyer->id,
            'subtotal' => $subtotal, 'tax_amount' => $tax, 'total' => $subtotal + $tax, 'status' => $status,
            'completed_at' => $status === 'selesai' ? $completedAt : null,
        ]);
        OrderItem::create(['order_id' => $order->id, 'product_id' => $product->id, 'product_name' => $product->name, 'quantity' => $qty, 'unit_price' => $subtotal / $qty, 'subtotal' => $subtotal]);

        return $order;
    }

    // ---------- Read-only ----------

    public function test_direktur_only_has_lihat_on_data_features(): void
    {
        $rows = Permission::where('role', 'direktur')->where('allowed', true)->get();
        foreach ($rows as $row) {
            if ($row->fitur_key === 'profil') {
                $this->assertContains($row->aksi, ['Lihat', 'Ubah']);   // profil milik sendiri
                continue;
            }
            $this->assertSame('Lihat', $row->aksi, "Direktur tidak boleh {$row->aksi} pada {$row->fitur_key}");
        }
    }

    public function test_direktur_dashboard_routes_are_get_only(): void
    {
        foreach (Route::getRoutes() as $route) {
            if (! str_starts_with($route->getName() ?? '', 'direktur.')) {
                continue;
            }
            $this->assertEmpty(array_diff($route->methods(), ['GET', 'HEAD']), 'Route direktur harus GET: '.$route->uri());
        }
    }

    public function test_direktur_is_rejected_on_every_write_route_of_other_roles(): void
    {
        $checked = 0;
        foreach (Route::getRoutes() as $route) {
            $methods = array_diff($route->methods(), ['GET', 'HEAD']);
            if (! $methods) {
                continue;
            }
            $mw = implode(' ', array_map(fn ($m) => is_string($m) ? $m : '', $route->gatherMiddleware()));
            // Hanya rute yang dijaga role/permission (bukan auth umum seperti logout, profil, login).
            if (! preg_match('/EnsureRole|role:|EnsurePermission|permission:/', $mw)) {
                continue;
            }
            if (str_starts_with($route->uri(), 'api/') || str_contains($route->uri(), '_boost')) {
                continue;
            }
            // Rute profil milik sendiri memang boleh.
            if (in_array($route->getName(), ['profile.update', 'password.update'], true)) {
                continue;
            }

            $uri = preg_replace('/\{[^}]+\}/', '1', $route->uri());
            $method = strtolower(array_values($methods)[0]);
            $response = $this->actingAs($this->direktur)->{$method}('/'.ltrim($uri, '/'));
            $this->assertContains($response->getStatusCode(), [403, 404, 405, 419], strtoupper($method)." /{$uri} seharusnya ditolak untuk Direktorat, dapat {$response->getStatusCode()}");
            $checked++;
        }
        $this->assertGreaterThan(10, $checked, 'Daftar rute tulis yang diuji terlalu sedikit.');
    }

    public function test_direktur_cannot_post_put_patch_delete_to_own_dashboard(): void
    {
        foreach (['post', 'put', 'patch', 'delete'] as $m) {
            $this->actingAs($this->direktur)->{$m}('/direktur/dashboard')->assertStatus(405);
            $this->actingAs($this->direktur)->{$m}('/direktur/dashboard/ekspor')->assertStatus(405);
        }
    }

    public function test_other_roles_cannot_open_direktur_dashboard(): void
    {
        foreach (['customer', 'admin_pengelola', 'admin_rtpu', 'pimpinan_rtpu'] as $role) {
            $user = User::factory()->create(['role' => $role]);
            $this->actingAs($user)->get('/direktur/dashboard')->assertForbidden();
            $this->actingAs($user)->get('/direktur/dashboard/ekspor')->assertForbidden();
        }
        auth()->logout();
        $this->get('/direktur/dashboard')->assertRedirect(route('login'));
    }

    public function test_direktur_without_lihat_permission_is_rejected(): void
    {
        Permission::where('role', 'direktur')->where('fitur_key', 'produk-unggulan')->where('aksi', 'Lihat')->update(['allowed' => false]);
        User::flushPermissionCache();

        $this->actingAs($this->direktur)->get('/direktur/dashboard')->assertForbidden();
    }

    // ---------- Halaman & validasi tanggal ----------

    public function test_dashboard_page_renders_with_deferred_summary(): void
    {
        $this->actingAs($this->direktur)->get('/direktur/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Direktur/Dashboard')->has('filters')->missing('summary'));
    }

    public function test_invalid_dates_are_rejected(): void
    {
        $this->actingAs($this->direktur)->get('/direktur/dashboard?from=bukan-tanggal&to=2026-01-01')->assertSessionHasErrors('from');
        $this->actingAs($this->direktur)->get('/direktur/dashboard?from=2026-05-10&to=2026-05-01')->assertSessionHasErrors('to');
        $this->actingAs($this->direktur)->get('/direktur/dashboard?preset=ngawur')->assertSessionHasErrors('preset');
        $this->actingAs($this->direktur)->get('/direktur/dashboard?from=2020-01-01&to=2026-01-01')->assertStatus(422);
    }

    // ---------- Agregasi ----------

    public function test_sales_counts_only_selesai_within_range_and_separates_tax(): void
    {
        $this->seedSale('selesai', '2026-11-10 10:00:00', 100000, 11000);
        $this->seedSale('selesai', '2026-11-12 10:00:00', 200000, 22000, 4);
        $this->seedSale('lunas', '2026-11-11 10:00:00');            // belum selesai
        $this->seedSale('selesai', '2026-09-01 10:00:00');          // di luar rentang

        $data = app(\App\Services\DirekturSummaryService::class)
            ->summary(\Carbon\Carbon::parse('2026-11-01'), \Carbon\Carbon::parse('2026-11-30'));

        $this->assertSame(2, $data['sales']['kpi']['transaksi']);
        $this->assertSame(333000, $data['sales']['kpi']['omzet_total']);
        $this->assertSame(300000, $data['sales']['kpi']['omzet_subtotal']);
        $this->assertSame(300000, $data['sales']['per_kategori'][0]['total']);
        $this->assertCount(2, $data['sales']['terlaris']);
        $this->assertSame(4, $data['sales']['terlaris'][0]['qty']);   // urut berdasarkan qty
    }

    public function test_series_fills_empty_days_with_zero(): void
    {
        $this->seedSale('selesai', '2026-11-10 10:00:00');

        $data = app(\App\Services\DirekturSummaryService::class)
            ->summary(\Carbon\Carbon::parse('2026-11-08'), \Carbon\Carbon::parse('2026-11-12'));

        $this->assertSame('day', $data['range']['granularity']);
        $this->assertCount(5, $data['sales']['series']);
        $this->assertSame([0, 0, 1, 0, 0], array_column($data['sales']['series'], 'transaksi'));
    }

    public function test_year_range_groups_by_month(): void
    {
        $this->seedSale('selesai', '2026-03-05 10:00:00');
        $this->seedSale('selesai', '2026-03-20 10:00:00');

        $data = app(\App\Services\DirekturSummaryService::class)
            ->summary(\Carbon\Carbon::parse('2026-01-01'), \Carbon\Carbon::parse('2026-12-31'));

        $this->assertSame('month', $data['range']['granularity']);
        $this->assertCount(12, $data['sales']['series']);
        $this->assertSame(2, $data['sales']['series'][2]['transaksi']);
    }

    public function test_funnel_uses_existing_statuses_only(): void
    {
        $cat = ProductCategory::firstOrCreate(['slug' => 'produk-fisik'], ['name' => 'Produk Fisik', 'is_active' => true]);
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        foreach (['draft', 'pending', 'verified', 'perlu_revisi_harga', 'counter_offer', 'approved', 'rejected'] as $s) {
            Product::create(['category_id' => $cat->id, 'owner_id' => $owner->id, 'name' => $s, 'slug' => $s, 'base_price' => 1, 'final_price' => 1, 'curation_status' => $s, 'is_active' => $s === 'approved']);
        }

        $data = app(\App\Services\DirekturSummaryService::class)->summary(now()->subDay(), now());
        $tahap = collect($data['funnel']['tahap'])->pluck('jumlah', 'key');

        $this->assertSame(1, $tahap['diajukan']);
        $this->assertSame(1, $tahap['diverifikasi']);
        $this->assertSame(2, $tahap['revisi_harga']);   // perlu_revisi_harga + counter_offer
        $this->assertSame(1, $tahap['disetujui']);
        $this->assertSame(1, $tahap['tayang']);
        $this->assertSame(1, $tahap['ditolak']);
        $this->assertSame(1, $data['funnel']['draft']);
        $this->assertSame(2, $data['negotiation']['berjalan']);
        $this->assertSame(1, $data['negotiation']['menunggu_pengelola']);
        $this->assertSame(1, $data['negotiation']['menunggu_rtpu']);
    }

    public function test_accounts_are_aggregate_only_without_personal_data(): void
    {
        User::factory()->customer()->count(3)->create(['name' => 'RAHASIA NAMA', 'email' => 'rahasia@example.com']);

        $data = app(\App\Services\DirekturSummaryService::class)->summary(now()->subMonth(), now());
        $json = json_encode($data);

        $this->assertStringNotContainsString('RAHASIA NAMA', $json);
        $this->assertStringNotContainsString('rahasia@example.com', $json);
        $customer = collect($data['accounts']['per_role'])->firstWhere('label', 'Customer');
        $this->assertSame(3, $customer['jumlah']);
    }

    public function test_aggregation_query_count_is_constant_regardless_of_rows(): void
    {
        $count = function () {
            \DB::flushQueryLog();
            \DB::enableQueryLog();
            app(\App\Services\DirekturSummaryService::class)->summary(\Carbon\Carbon::parse('2026-11-01'), \Carbon\Carbon::parse('2026-11-30'));
            $n = count(\DB::getQueryLog());
            \DB::disableQueryLog();

            return $n;
        };

        $this->seedSale('selesai', '2026-11-10 10:00:00');
        $few = $count();
        foreach (range(1, 8) as $i) {
            $this->seedSale('selesai', '2026-11-1'.($i % 9).' 10:00:00');
        }
        $this->assertSame($few, $count(), 'Jumlah query tidak boleh bertambah seiring jumlah baris (N+1).');
    }

    // ---------- Ekspor ----------

    public function test_csv_export_is_read_only_and_neutralizes_formulas(): void
    {
        $this->seedSale('selesai', now()->toDateTimeString());
        Product::query()->update(['name' => '=HYPERLINK("http://jahat")']);
        \DB::table('order_items')->update(['product_name' => '=HYPERLINK("http://jahat")']);

        $response = $this->actingAs($this->direktur)->get('/direktur/dashboard/ekspor?preset=30hari');
        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('Content-Type'));
        $csv = $response->streamedContent();
        $this->assertStringContainsString("'=HYPERLINK", $csv);
        $this->assertStringNotContainsString(',=HYPERLINK', $csv);
    }
}

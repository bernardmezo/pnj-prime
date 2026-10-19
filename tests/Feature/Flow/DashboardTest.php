<?php

namespace Tests\Feature\Flow;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProdukUnggulan;
use App\Models\User;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected array $users = [];

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([ProductCategorySeeder::class, UsecaseSeeder::class]);
        foreach ([
            'customer' => 'c@test.id', 'admin_rtpu' => 'rtpu@test.id',
            'admin_p3m' => 'p3m@test.id', 'pimpinan_rtpu' => 'pim@test.id',
            'direktur' => 'dir@test.id', 'super_admin' => 'sa@test.id',
        ] as $role => $email) {
            $this->users[$role] = User::factory()->create(['email' => $email, 'role' => $role]);
        }
    }

    public function test_each_role_opens_own_dashboard(): void
    {
        $cases = [
            'admin_rtpu' => ['/rtpu/dashboard', 'Rtpu/Dashboard'],
            'admin_p3m' => ['/p3m/dashboard', 'P3M/Dashboard'],
            'pimpinan_rtpu' => ['/pimpinan/dashboard', 'Pimpinan/Dashboard'],
            'direktur' => ['/direktur/dashboard', 'Direktur/Dashboard'],
            'super_admin' => ['/superadmin/dashboard', 'SuperAdmin/Dashboard'],
        ];

        foreach ($cases as $role => [$uri, $component]) {
            $this->actingAs($this->users[$role])
                ->get($uri)
                ->assertOk()
                ->assertInertia(fn ($page) => $page->component($component)->has('stats'));
        }
    }

    public function test_rtpu_dashboard_stats_reflect_data(): void
    {
        $product = Product::create([
            'owner_id' => $this->users['admin_rtpu']->id,
            'category_id' => ProductCategory::where('slug', 'jasa-layanan')->first()->id,
            'name' => 'Layanan uji',
            'slug' => 'layanan-uji-'.uniqid(),
            'base_price' => 100000,
            'final_price' => 100000,
            'curation_status' => 'approved',
            'is_active' => true,
        ]);
        Pengajuan::create([
            'code' => 'PNJ-T-'.uniqid(),
            'buyer_id' => $this->users['customer']->id,
            'product_id' => $product->id,
            'tipe' => 'jasa',
            'status' => 'Diajukan',
            'history' => [],
        ]);

        $this->actingAs($this->users['admin_rtpu'])
            ->get('/rtpu/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.menunggu_verifikasi', 1)
                ->where('stats.total_layanan', 1)
                ->where('recentPengajuan.0.customer', $this->users['customer']->name));
    }

    public function test_p3m_dashboard_is_scoped_to_owner(): void
    {
        ProdukUnggulan::create([
            'code' => 'PU-'.uniqid(), 'owner_id' => $this->users['admin_p3m']->id,
            'name' => 'Milik saya', 'researcher' => 'R', 'category' => 'Alat',
            'price' => 1000, 'status' => 'Diajukan',
        ]);
        $other = User::factory()->create(['email' => 'other@test.id', 'role' => 'admin_p3m']);
        ProdukUnggulan::create([
            'code' => 'PU-'.uniqid(), 'owner_id' => $other->id,
            'name' => 'Milik orang', 'researcher' => 'R', 'category' => 'Alat',
            'price' => 1000, 'status' => 'Diajukan',
        ]);

        $this->actingAs($this->users['admin_p3m'])
            ->get('/p3m/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.total', 1)
                ->where('daftar.0.name', 'Milik saya'));
    }

    public function test_super_admin_dashboard_counts_users(): void
    {
        $this->actingAs($this->users['super_admin'])
            ->get('/superadmin/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('stats.total_users', 6)
                ->where('stats.active_users', 6)
                ->has('stats.total_fitur'));
    }

    public function test_cross_role_access_is_forbidden(): void
    {
        $this->actingAs($this->users['customer'])->get('/rtpu/dashboard')->assertForbidden();
        $this->actingAs($this->users['admin_rtpu'])->get('/superadmin/dashboard')->assertForbidden();
        $this->actingAs($this->users['admin_p3m'])->get('/direktur/dashboard')->assertForbidden();
    }

    public function test_guests_are_redirected_to_login(): void
    {
        foreach (['/rtpu/dashboard', '/p3m/dashboard', '/pimpinan/dashboard', '/direktur/dashboard', '/superadmin/dashboard'] as $uri) {
            $this->get($uri)->assertRedirect('/login');
        }
    }
}

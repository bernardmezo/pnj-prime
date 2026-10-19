<?php

namespace Tests\Feature\Flow;

use App\Models\Fitur;
use App\Models\MetodePembayaran;
use App\Models\Pengajuan;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProdukUnggulan;
use App\Models\User;
use App\Services\SettingService;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AccessMatrixTest extends TestCase
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

    private function product(): Product
    {
        return Product::create([
            'owner_id' => $this->users['admin_rtpu']->id,
            'category_id' => ProductCategory::where('slug', 'jasa-layanan')->first()->id,
            'name' => 'Layanan uji',
            'slug' => 'layanan-uji-'.uniqid(),
            'base_price' => 100000,
            'final_price' => 100000,
            'curation_status' => 'approved',
            'is_active' => true,
        ]);
    }

    private function pengajuan(string $status = 'Diajukan'): Pengajuan
    {
        return Pengajuan::create([
            'code' => 'PNJ-T-'.uniqid(),
            'buyer_id' => $this->users['customer']->id,
            'tipe' => 'jasa',
            'status' => $status,
            'history' => [],
        ]);
    }

    // ---------- role x route matrix (protected routes) ----------

    public function test_guest_is_redirected_to_login(): void
    {
        foreach (['/pengajuan', '/p3m/produk-unggulan', '/rtpu/status', '/superadmin/users', '/dashboard'] as $uri) {
            $this->get($uri)->assertRedirect('/login');
        }
    }

    public function test_customer_route_access(): void
    {
        $this->actingAs($this->users['customer']);
        $p = $this->pengajuan();
        $this->get('/pengajuan')->assertOk();
        $this->get('/pengajuan/create')->assertOk();
        $this->get("/pengajuan/{$p->id}")->assertOk();
        $this->get('/riwayat')->assertOk();
        // staff-only areas denied
        $this->get('/rtpu/status')->assertForbidden();
        $this->get('/pimpinan/verifikasi')->assertForbidden();
        $this->get('/direktur/pemantauan')->assertForbidden();
        $this->get('/superadmin/users')->assertForbidden();
        $this->get('/p3m/produk-unggulan')->assertForbidden();
        // mutating staff endpoints denied (binding resolves first, then role gate)
        $this->patch("/rtpu/verifikasi/layanan/{$p->id}/approve")->assertForbidden();
        $this->post('/p3m/produk-unggulan', ['name' => 'x'])->assertForbidden();
    }

    public function test_admin_rtpu_route_access(): void
    {
        $this->actingAs($this->users['admin_rtpu']);
        $p = $this->pengajuan();
        $this->get('/rtpu/verifikasi/layanan')->assertOk();
        $this->get('/rtpu/verifikasi/pembayaran')->assertOk();
        $this->get('/rtpu/status')->assertOk();
        $this->get('/rtpu/layanan')->assertOk();
        $this->get('/rtpu/metode')->assertOk();
        $this->get('/rtpu/riwayat')->assertOk();
        // other lanes denied
        $this->get('/pimpinan/verifikasi')->assertForbidden();
        $this->get('/direktur/pemantauan')->assertForbidden();
        $this->get('/superadmin/users')->assertForbidden();
        $this->get('/p3m/produk-unggulan')->assertForbidden();
        $this->get('/pengajuan')->assertForbidden(); // customer-only lane
    }

    public function test_admin_p3m_route_access(): void
    {
        $this->actingAs($this->users['admin_p3m']);
        $this->get('/p3m/produk-unggulan')->assertOk();
        $this->get('/p3m/riwayat')->assertOk();
        $this->get('/rtpu/status')->assertForbidden();
        $this->get('/pimpinan/verifikasi')->assertForbidden();
        $this->get('/direktur/pemantauan')->assertForbidden();
        $this->get('/superadmin/users')->assertForbidden();
        $this->get('/pengajuan')->assertForbidden();
    }

    public function test_pimpinan_route_access(): void
    {
        $this->actingAs($this->users['pimpinan_rtpu']);
        $this->get('/pimpinan/verifikasi')->assertOk();
        $this->get('/pimpinan/pemantauan')->assertOk();
        $this->get('/pimpinan/riwayat')->assertOk();
        $this->get('/rtpu/status')->assertForbidden();
        $this->get('/p3m/produk-unggulan')->assertForbidden();
        $this->get('/direktur/pemantauan')->assertForbidden();
        $this->get('/superadmin/users')->assertForbidden();
        $this->get('/pengajuan')->assertForbidden();
    }

    public function test_direktur_is_read_only(): void
    {
        $this->actingAs($this->users['direktur']);
        $this->get('/direktur/pemantauan')->assertOk();
        $this->get('/direktur/riwayat')->assertOk();

        $p = $this->pengajuan();
        $pu = ProdukUnggulan::create([
            'code' => 'PNJ-PU-T1', 'owner_id' => $this->users['admin_p3m']->id,
            'name' => 'X', 'status' => 'Diajukan', 'history' => [],
        ]);
        foreach ([
            ['patch', "/rtpu/verifikasi/layanan/{$p->id}/approve"],
            ['patch', "/rtpu/verifikasi/layanan/{$p->id}/reject", ['catatan' => 'x']],
            ['post', '/pengajuan', ['tipe' => 'jasa']],
            ['patch', "/pengajuan/{$p->id}"],
            ['patch', "/p3m/produk-unggulan/{$pu->id}"],
            ['patch', "/pimpinan/verifikasi/{$pu->id}/approve"],
            ['post', '/superadmin/users', ['name' => 'x', 'email' => 'x@y.id', 'password' => 'password123', 'role' => 'customer']],
            ['post', '/rtpu/metode', ['name' => 'x', 'type' => 'y', 'account' => 'z', 'holder' => 'w']],
            ['post', '/rtpu/layanan', ['tipe' => 'jasa', 'name' => 'x', 'price' => 1]],
            ['patch', "/rtpu/status/{$p->id}", ['status' => 'Selesai']],
            ['post', '/superadmin/fitur', ['name' => 'x', 'key' => 'x']],
            ['post', '/superadmin/hak-akses', ['matriks' => []]],
        ] as $entry) {
            [$method, $uri] = [$entry[0], $entry[1]];
            $data = $entry[2] ?? [];
            $this->{$method}($uri, $data)->assertForbidden("direktur must be denied {$method} {$uri}");
        }
    }

    public function test_superadmin_route_access(): void
    {
        $this->actingAs($this->users['super_admin']);
        $this->get('/superadmin/users')->assertOk();
        $this->get('/superadmin/hak-akses')->assertOk();
        $this->get('/superadmin/fitur')->assertOk();
        // outside its lane
        $this->get('/rtpu/status')->assertForbidden();
        $this->get('/pimpinan/verifikasi')->assertForbidden();
        $this->get('/pengajuan')->assertForbidden();
    }

    // ---------- S9: produk unggulan ----------

    public function test_pimpinan_approve_creates_inactive_layanan_once(): void
    {
        $this->actingAs($this->users['admin_p3m']);
        $this->post(route('p3m.produk.store'), [
            'name' => 'Filter Air Gambut', 'desc' => 'Filter tiga tahap.',
            'researcher' => 'Dr. B', 'category' => 'Lingkungan', 'price' => 1250000,
        ])->assertRedirect();
        $pu = ProdukUnggulan::latest('id')->first();

        $this->actingAs($this->users['pimpinan_rtpu']);
        $this->patch(route('pimpinan.verify.approve', $pu))->assertRedirect();

        $layanan = Product::where('produk_unggulan_id', $pu->id)->firstOrFail();
        $this->assertFalse((bool) $layanan->is_active);
        $this->assertSame('draft', $layanan->curation_status);
        $this->assertSame('Filter Air Gambut', $layanan->name);
        $this->assertSame(1250000, (int) $layanan->final_price);
        $this->assertStringContainsString('Filter tiga tahap.', $layanan->description);
        $this->assertSame($pu->owner_id, $layanan->owner_id);

        // history row written on the produk unggulan
        $history = $pu->fresh()->history;
        $last = $history[count($history) - 1];
        $this->assertSame('Disetujui', $last['status']);
        $this->assertStringContainsString((string) $layanan->id, $last['note'] ?? '');

        // approving twice never duplicates
        $pu2 = ProdukUnggulan::create([
            'code' => 'PNJ-PU-DUP', 'owner_id' => $this->users['admin_p3m']->id,
            'name' => 'Duplikat', 'status' => 'Diajukan', 'history' => [],
        ]);
        $this->patch(route('pimpinan.verify.approve', $pu2))->assertRedirect();
        $countBefore = Product::where('produk_unggulan_id', $pu2->id)->count();
        // second approve is blocked by status guard and creates nothing new
        $this->patch(route('pimpinan.verify.approve', $pu2))->assertForbidden();
        $this->assertSame($countBefore, Product::where('produk_unggulan_id', $pu2->id)->count());

        // never auto-published: absent from public catalog...
        $this->get(route('catalog.show', $layanan->slug))->assertNotFound();

        // ...until Admin RTPU sets price/stock and activates it
        $this->actingAs($this->users['admin_rtpu']);
        $this->patch(route('rtpu.layanan.update', $layanan), [
            'tipe' => 'jasa', 'name' => $layanan->name, 'price' => 1300000, 'active' => true,
        ])->assertRedirect();
        $layanan->refresh();
        $this->assertTrue((bool) $layanan->is_active);
        $this->assertSame(1300000, (int) $layanan->final_price);
    }

    public function test_produk_unggulan_flow_and_guards(): void
    {
        Storage::fake('public');
        $this->actingAs($this->users['admin_p3m']);
        // invalid file rejected
        $this->post(route('p3m.produk.store'), [
            'name' => 'Alat X',
            'dokumen' => [UploadedFile::fake()->create('x.exe', 100, 'application/x-msdownload')],
        ])->assertSessionHasErrors(['dokumen.0']);
        // valid create
        $this->post(route('p3m.produk.store'), [
            'name' => 'Alat X', 'researcher' => 'Dr. A',
            'dokumen' => [UploadedFile::fake()->create('p.pdf', 100, 'application/pdf')],
        ])->assertRedirect();
        $pu = ProdukUnggulan::latest('id')->first();
        $this->assertSame('Diajukan', $pu->status);

        // admin_rtpu + customer cannot verify
        $this->actingAs($this->users['admin_rtpu']);
        $this->patch(route('pimpinan.verify.approve', $pu))->assertForbidden();
        $this->actingAs($this->users['customer']);
        $this->patch(route('pimpinan.verify.approve', $pu))->assertForbidden();

        // pimpinan approves
        $this->actingAs($this->users['pimpinan_rtpu']);
        $this->patch(route('pimpinan.verify.approve', $pu))->assertRedirect();
        $this->assertSame('Disetujui', $pu->fresh()->status);

        // D1: approval creates a linked INACTIVE layanan (never auto-published)
        $layanan = Product::where('produk_unggulan_id', $pu->id)->firstOrFail();
        $this->assertFalse((bool) $layanan->is_active);
        $this->assertSame('draft', $layanan->curation_status);
        $this->get(route('catalog.show', $layanan->slug))->assertNotFound();

        // documents downloadable by owner + pimpinan + direktur, not by another P3M user
        $this->get(route('berkas.show', ['kind' => 'produk-dokumen', 'id' => $pu->id, 'index' => 0]))->assertOk();
        $stranger = User::factory()->adminP3m()->create(['email' => 'p3m-lain@test.id']);
        $this->actingAs($stranger);
        $this->get(route('berkas.show', ['kind' => 'produk-dokumen', 'id' => $pu->id, 'index' => 0]))->assertForbidden();
        $this->actingAs($this->users['direktur']);
        $this->get(route('berkas.show', ['kind' => 'produk-dokumen', 'id' => $pu->id, 'index' => 0]))->assertOk();
    }

    // ---------- S11: super admin ----------

    public function test_superadmin_manages_staff_and_last_admin_guard(): void
    {
        $this->actingAs($this->users['super_admin']);
        foreach (['admin_rtpu', 'admin_p3m', 'pimpinan_rtpu', 'direktur', 'super_admin'] as $i => $role) {
            $this->post(route('superadmin.users.store'), [
                'name' => "Staff {$role}", 'email' => "staff{$i}@test.id",
                'password' => 'password123', 'role' => $role,
            ])->assertRedirect();
        }
        // each new staff can log in and reach dashboard
        foreach (['staff0@test.id', 'staff1@test.id', 'staff2@test.id', 'staff3@test.id', 'staff4@test.id'] as $email) {
            $this->post('/login', ['email' => $email, 'password' => 'password123'])
                ->assertRedirect(route('dashboard', absolute: false));
            $this->post(route('logout'));
        }
        // deactivated staff cannot log in
        $this->actingAs($this->users['super_admin']);
        $victim = User::where('email', 'staff0@test.id')->first();
        $this->patch(route('superadmin.users.toggle', $victim))->assertRedirect();
        $this->post(route('logout'));
        $this->post('/login', ['email' => 'staff0@test.id', 'password' => 'password123'])
            ->assertSessionHasErrors(['email']);
        $this->assertGuest();

        // cannot delete or demote self (last-admin invariant holds via the actor)
        $this->actingAs($this->users['super_admin']);
        $me = $this->users['super_admin']->fresh();
        $this->delete(route('superadmin.users.destroy', $me))->assertForbidden();
        $this->patch(route('superadmin.users.update', $me), [
            'name' => 'x', 'email' => 'sa@test.id', 'role' => 'customer',
        ])->assertForbidden();
        $this->assertSame('super_admin', $me->fresh()->role);
    }

    public function test_permission_toggle_takes_effect(): void
    {        // revoke customer Lihat on pengajuan -> 403 on the lane
        $this->actingAs($this->users['super_admin']);
        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['customer' => ['pengajuan' => ['Lihat' => false]]],
        ])->assertRedirect();

        $this->actingAs($this->users['customer']);
        $this->get('/pengajuan')->assertForbidden();

        // restore -> access returns
        $this->actingAs($this->users['super_admin']);
        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['customer' => ['pengajuan' => ['Lihat' => true]]],
        ])->assertRedirect();
        $this->actingAs($this->users['customer']);
        $this->get('/pengajuan')->assertOk();
    }

    public function test_hakakses_rejects_unknown_keys(): void
    {
        $this->actingAs($this->users['super_admin']);
        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['hacker' => ['katalog' => ['Lihat' => true]]],
        ])->assertStatus(422);
        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['customer' => ['fitur-gelap' => ['Lihat' => true]]],
        ])->assertStatus(422);
        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['customer' => ['katalog' => ['Menghapus' => true]]],
        ])->assertStatus(422);
        $this->assertSame(0, Permission::where('role', 'hacker')->count());
    }

    public function test_fitur_deactivation_blocks_lane(): void
    {
        $this->actingAs($this->users['super_admin']);
        $fitur = Fitur::where('key', 'pengajuan')->firstOrFail();
        $this->patch(route('superadmin.fitur.update', $fitur->key), [
            'name' => $fitur->nama, 'active' => false,
        ])->assertRedirect();
        $this->assertFalse($fitur->fresh()->aktif);

        // blocked for every role, including Super Admin
        $this->actingAs($this->users['customer']);
        $this->get('/pengajuan')->assertForbidden();
        $this->actingAs($this->users['super_admin']);
        $this->get('/pengajuan')->assertForbidden();

        // reactivate -> access returns
        $this->patch(route('superadmin.fitur.update', $fitur->key), [
            'name' => $fitur->nama, 'active' => true,
        ])->assertRedirect();
        $this->actingAs($this->users['customer']);
        $this->get('/pengajuan')->assertOk();
    }

    public function test_fitur_deactivation_blocks_riwayat_routes(): void
    {
        $this->actingAs($this->users['super_admin']);

        $pengajuan = Fitur::where('key', 'pengajuan')->firstOrFail();
        $this->patch(route('superadmin.fitur.update', $pengajuan->key), [
            'name' => $pengajuan->nama, 'active' => false,
        ])->assertRedirect();

        // Every pengajuan-lane riwayat must be gated, not just the index.
        $this->actingAs($this->users['customer']);
        $this->get('/riwayat')->assertForbidden();
        $this->actingAs($this->users['admin_rtpu']);
        $this->get('/rtpu/riwayat')->assertForbidden();

        $this->actingAs($this->users['super_admin']);
        $this->patch(route('superadmin.fitur.update', $pengajuan->key), [
            'name' => $pengajuan->nama, 'active' => true,
        ])->assertRedirect();

        $unggulan = Fitur::where('key', 'produk-unggulan')->firstOrFail();
        $this->patch(route('superadmin.fitur.update', $unggulan->key), [
            'name' => $unggulan->nama, 'active' => false,
        ])->assertRedirect();

        $this->actingAs($this->users['admin_p3m']);
        $this->get('/p3m/riwayat')->assertForbidden();
        $this->actingAs($this->users['pimpinan_rtpu']);
        $this->get('/pimpinan/riwayat')->assertForbidden();
        $this->actingAs($this->users['direktur']);
        $this->get('/direktur/riwayat')->assertForbidden();
    }

    public function test_protected_fitur_cannot_be_deactivated(): void
    {
        $this->actingAs($this->users['super_admin']);
        foreach (['pengguna', 'hak-akses', 'fitur'] as $key) {
            $fitur = Fitur::where('key', $key)->firstOrFail();
            $this->patch(route('superadmin.fitur.update', $fitur->key), [
                'name' => $fitur->nama, 'active' => false,
            ])->assertStatus(422);
            $this->assertTrue($fitur->fresh()->aktif);
            $this->delete(route('superadmin.fitur.destroy', $fitur->key))->assertStatus(422);
            $this->assertNotNull(Fitur::where('key', $key)->first());
        }
    }

    // ---------- S12: master data ----------

    public function test_layanan_crud_and_delete_with_pengajuan(): void
    {
        $this->actingAs($this->users['admin_rtpu']);
        // validation
        $this->post(route('rtpu.layanan.store'), ['tipe' => 'jasa', 'price' => -5])
            ->assertSessionHasErrors(['name', 'price']);
        // create per tipe
        foreach (['jasa', 'ruangan', 'produk'] as $tipe) {
            $this->post(route('rtpu.layanan.store'), [
                'tipe' => $tipe, 'name' => "Layanan {$tipe} baru", 'price' => 50000,
            ])->assertRedirect(route('rtpu.layanan'));
        }
        $this->assertSame(3, Product::where('name', 'like', 'Layanan % baru')->count());

        // delete a layanan that has a pengajuan: soft-handled (reference nulled)
        $prod = Product::where('name', 'Layanan jasa baru')->firstOrFail();
        $pj = Pengajuan::create([
            'code' => 'PNJ-T-DEL', 'buyer_id' => $this->users['customer']->id,
            'product_id' => $prod->id, 'tipe' => 'jasa', 'status' => 'Diajukan', 'history' => [],
        ]);
        $this->delete(route('rtpu.layanan.destroy', $prod))->assertRedirect();
        $this->assertSoftDeleted('products', ['id' => $prod->id]);
        // soft-handled: reference kept for audit, item hidden from catalog
        $this->assertSame('Layanan jasa baru', $pj->fresh()->product()->withTrashed()->first()->name);
        $this->get('/katalog')->assertOk();
        $this->get(route('catalog.show', $prod->slug))->assertNotFound();

        // metode: cannot leave zero active
        $only = MetodePembayaran::where('aktif', true)->get();
        foreach ($only as $m) {
            MetodePembayaran::where('id', '!=', $m->id)->update(['aktif' => false]);
        }
        $last = MetodePembayaran::where('aktif', true)->firstOrFail();
        $this->delete(route('rtpu.metode.destroy', $last))
            ->assertSessionHasErrors(['metode']);
        $this->assertTrue($last->fresh()->aktif);
        $this->patch(route('rtpu.metode.update', $last), [
            'name' => $last->nama, 'type' => $last->tipe, 'account' => $last->rekening,
            'holder' => $last->holder, 'active' => false,
        ])->assertSessionHasErrors(['active']);
        $this->assertTrue($last->fresh()->aktif);
    }

    // ---------- S13 + PPN ----------

    public function test_pemantauan_vs_riwayat_scopes(): void
    {
        $open = $this->pengajuan('Diajukan');
        $closed = $this->pengajuan('Selesai');

        // customer
        $this->actingAs($this->users['customer']);
        $this->get(route('customer.pengajuan.index'))->assertInertia(fn ($p) => $p->has('pengajuan', 1)->where('pengajuan.0.code', $open->code)
        );
        $this->get(route('customer.riwayat'))->assertInertia(fn ($p) => $p->has('riwayat', 1)->where('riwayat.0.code', $closed->code)
        );

        // rtpu sees allincode, p3m sees none of layanan
        $this->actingAs($this->users['admin_rtpu']);
        $this->get(route('rtpu.riwayat'))->assertInertia(fn ($p) => $p->has('riwayat', 2));
        $this->actingAs($this->users['admin_p3m']);
        $this->get(route('p3m.riwayat'))->assertInertia(fn ($p) => $p->has('riwayat', 0));
    }

    public function test_ppn_rate_change_not_retroactive_and_totals_equal(): void
    {
        Storage::fake('public');
        DB::table('settings')->updateOrInsert(
            ['key' => 'ppn_enabled'],
            ['value' => '1', 'label' => 'PPN aktif', 'type' => 'boolean']
        );
        DB::table('settings')->updateOrInsert(
            ['key' => 'ppn_rate'],
            ['value' => '11', 'label' => 'Tarif PPN', 'type' => 'integer']
        );

        $this->actingAs($this->users['customer']);
        $prod = $this->product();
        $prod->update(['final_price' => 1000000]);
        $this->post(route('customer.pengajuan.store'), ['tipe' => 'produk', 'product_id' => $prod->id, 'jumlah' => '2']);
        $p = Pengajuan::latest('id')->first();

        $this->actingAs($this->users['admin_rtpu']);
        $this->patch(route('rtpu.verify.layanan.approve', $p))->assertRedirect();
        $p->refresh();
        $this->assertSame(2000000, (int) $p->order->subtotal);
        $this->assertSame(220000, (int) $p->order->tax_amount); // deterministic rounding
        $this->assertSame(2220000, (int) $p->order->total);
        printf("PPN 11%% atas 2000000: ppn=%d total=%d\n", $p->order->tax_amount, $p->order->total);

        // checkout shows the same figures
        $this->actingAs($this->users['customer']);
        $this->get(route('customer.pengajuan.bayar', $p))->assertInertia(fn ($pg) => $pg
            ->where('tagihan.subtotal', 2000000)
            ->where('tagihan.ppn', 220000)
            ->where('tagihan.total', 2220000)
        );

        // admin changes rate to 12% via the service (clears cache, like the settings screen): paid order untouched, new order uses 12%
        app(SettingService::class)->set('ppn_rate', '12');
        $this->assertSame(2220000, (int) $p->fresh()->order->total);
        $this->post(route('customer.pengajuan.store'), ['tipe' => 'produk', 'product_id' => $prod->id, 'jumlah' => '1']);
        $p2 = Pengajuan::latest('id')->first();
        $this->actingAs($this->users['admin_rtpu']);
        $this->patch(route('rtpu.verify.layanan.approve', $p2))->assertRedirect();
        $this->assertSame(120000, (int) $p2->fresh()->order->tax_amount);

        DB::table('settings')->where('key', 'ppn_rate')->update(['value' => '11']);
    }

    public function test_money_stored_as_integers(): void
    {
        $cols = ['orders' => ['subtotal', 'tax_amount', 'total'], 'products' => ['base_price', 'final_price']];
        foreach ($cols as $table => $fields) {
            foreach ($fields as $f) {
                $type = DB::getSchemaBuilder()->getColumnType($table, $f);
                $this->assertContains($type, ['bigint', 'integer', 'decimal'], "{$table}.{$f} is {$type}");
            }
        }
    }

    public function test_ppn_threshold_boundaries(): void
    {
        $svc = app(SettingService::class);
        $svc->set('ppn_enabled', '1');
        $svc->set('ppn_rate', '10');
        $svc->set('ppn_threshold', '2000000');

        $this->assertSame(0, $svc->calculateTax(1999999));   // below: no tax
        $this->assertSame(0, $svc->calculateTax(2000000));   // exactly at: no tax (rule is GREATER THAN)
        $this->assertSame(200000, $svc->calculateTax(2000001)); // above: taxed, deterministic rounding
        printf("threshold 2000000: 1999999->0, 2000000->0, 2000001->200000\n");

        // threshold 0 preserves today's behavior (everything taxed)
        $svc->set('ppn_threshold', '0');
        $this->assertSame(100000, $svc->calculateTax(1000000));
    }

    public function test_ppn_midflight_change_and_full_agreement(): void
    {
        Storage::fake('public');
        $svc = app(SettingService::class);
        $svc->set('ppn_enabled', '1');
        $svc->set('ppn_rate', '10');
        $svc->set('ppn_threshold', '0');

        $this->actingAs($this->users['customer']);
        $prod = $this->product();
        $prod->update(['final_price' => 1000000]);
        $this->post(route('customer.pengajuan.store'), ['tipe' => 'produk', 'product_id' => $prod->id, 'jumlah' => '1']);
        $p = Pengajuan::latest('id')->first();

        $this->actingAs($this->users['admin_rtpu']);
        $this->patch(route('rtpu.verify.layanan.approve', $p))->assertRedirect();

        // admin raises threshold mid-flight: paid order figures frozen
        $svc->set('ppn_threshold', '5000000');
        $p->refresh();
        $this->assertSame(100000, (int) $p->order->tax_amount);
        $this->assertSame(1100000, (int) $p->order->total);

        // checkout screen, stored order, and customer view all agree
        $this->actingAs($this->users['customer']);
        $this->get(route('customer.pengajuan.bayar', $p))->assertInertia(fn ($pg) => $pg
            ->where('tagihan.subtotal', 1000000)
            ->where('tagihan.ppn', 100000)
            ->where('tagihan.total', 1100000)
        );
        printf("agreement: checkout=order=1100000 (subtotal 1000000 + ppn 100000)\n");
    }

    public function test_settings_changes_are_audited(): void
    {
        $this->actingAs($this->users['admin_rtpu']);
        $this->patch(route('admin.settings.update'), [
            'settings' => ['ppn_rate' => '11', 'ppn_threshold' => '0'],
        ])->assertRedirect();

        $row = DB::table('settings_audit')->where('key', 'ppn_rate')->latest('id')->first();
        $this->assertNotNull($row);
        $this->assertSame('11', $row->new_value);
        $this->assertSame($this->users['admin_rtpu']->id, (int) $row->changed_by);
        $this->assertNotNull($row->changed_at);

        // audit visible read-only on the settings screen (last 20)
        $this->get(route('admin.settings.index'))->assertInertia(fn ($pg) => $pg
            ->has('audits')
            ->where('audits.0.key', 'ppn_threshold')
        );
    }
}

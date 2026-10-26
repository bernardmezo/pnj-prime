<?php

namespace Tests\Feature\UseCase;

use App\Models\MetodePembayaran;
use App\Models\Pengajuan;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProdukUnggulan;
use App\Models\User;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\TestDox;
use Tests\TestCase;

/**
 * CHECK C — relationship checks R1..R11, one test per relationship.
 */
class RelationshipConformanceTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected User $customer2;

    protected User $rtpu;

    protected User $p3m;

    protected User $p3m2;

    protected User $pimpinan;

    protected User $direktur;

    protected User $superadmin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([ProductCategorySeeder::class, UsecaseSeeder::class]);

        $this->customer = User::factory()->customer()->create(['email' => 'c1@rel.test']);
        $this->customer2 = User::factory()->customer()->create(['email' => 'c2@rel.test']);
        $this->rtpu = User::factory()->adminRtpu()->create(['email' => 'rtpu@rel.test']);
        $this->p3m = User::factory()->adminP3m()->create(['email' => 'p3m@rel.test']);
        $this->p3m2 = User::factory()->adminP3m()->create(['email' => 'p3mb@rel.test']);
        $this->pimpinan = User::factory()->pimpinanRtpu()->create(['email' => 'pim@rel.test']);
        $this->direktur = User::factory()->direktur()->create(['email' => 'dir@rel.test']);
        $this->superadmin = User::factory()->superAdmin()->create(['email' => 'sa@rel.test']);
    }

    private function product(string $tipe = 'jasa', int $price = 100000, bool $active = true, string $curation = 'approved'): Product
    {
        $slug = ['jasa' => 'jasa-layanan', 'ruangan' => 'sewa-fasilitas', 'produk' => 'produk-fisik'][$tipe];

        return Product::create([
            'owner_id' => $this->rtpu->id,
            'category_id' => ProductCategory::where('slug', $slug)->firstOrFail()->id,
            'name' => 'Layanan '.$tipe.' '.uniqid(),
            'slug' => 'layanan-'.$tipe.'-'.uniqid(),
            'base_price' => $price,
            'final_price' => $price,
            'curation_status' => $curation,
            'is_active' => $active,
        ]);
    }

    private function pengajuan(User $owner, string $status = 'Diajukan', string $tipe = 'jasa'): Pengajuan
    {
        return Pengajuan::create([
            'code' => 'PNJ-T-'.uniqid(), 'buyer_id' => $owner->id, 'tipe' => $tipe,
            'keperluan' => 'Butuh', 'jumlah' => '1', 'status' => $status,
            'history' => [['from' => null, 'status' => $status, 'at' => now()->format('Y-m-d H:i'), 'note' => null, 'by' => null]],
        ]);
    }

    private function produkUnggulan(User $owner, string $status = 'Diajukan'): ProdukUnggulan
    {
        return ProdukUnggulan::create([
            'code' => 'PNJ-PU-'.uniqid(), 'owner_id' => $owner->id,
            'name' => 'PU '.uniqid(), 'status' => $status, 'history' => [],
        ]);
    }

    #[TestDox('R1 UC-01 include UC-02 / UC-03 extend UC-01 — login & register reachability')]
    public function test_r1_login_include_credentials_and_register_extend(): void
    {
        // UC-03 is reachable from the login screen (both guest routes exist).
        $this->get(route('login'))->assertOk()->assertInertia(fn (Assert $p) => $p->component('Auth/Login'));
        $this->get(route('register'))->assertOk()->assertInertia(fn (Assert $p) => $p->component('Auth/Register'));

        // Wrong password and unknown email give the SAME generic message.
        $this->post('/login', ['email' => 'c1@rel.test', 'password' => 'salah'])
            ->assertSessionHasErrors(['email' => trans('auth.failed')]);
        $this->post('/login', ['email' => 'tidak-ada@rel.test', 'password' => 'password'])
            ->assertSessionHasErrors(['email' => trans('auth.failed')]);
        $this->assertGuest(); // no state change on failure

        // Inactive users cannot log in.
        $this->customer->update(['is_active' => false]);
        $this->post('/login', ['email' => 'c1@rel.test', 'password' => 'password'])
            ->assertSessionHasErrors(['email']);
        $this->assertGuest();

        // Registration is Customer-only: a forged staff role is ignored.
        $this->post('/register', [
            'name' => 'Self', 'email' => 'self@rel.test', 'password' => 'password123',
            'password_confirmation' => 'password123', 'terms' => true, 'role' => 'super_admin',
        ]);
        $this->assertSame('customer', User::where('email', 'self@rel.test')->firstOrFail()->role);
    }

    #[TestDox('R2 UC-03 include UC-04 — registration validated server-side')]
    public function test_r2_register_include_validation(): void
    {
        $this->post('/register', [])->assertSessionHasErrors(['name', 'email', 'password']);
        $this->post('/register', ['name' => 'A', 'email' => 'bukan-email', 'password' => 'password123', 'password_confirmation' => 'password123', 'terms' => true])
            ->assertSessionHasErrors(['email']);
        User::factory()->create(['email' => 'dupe@rel.test']);
        $this->post('/register', ['name' => 'A', 'email' => 'dupe@rel.test', 'password' => 'password123', 'password_confirmation' => 'password123', 'terms' => true])
            ->assertSessionHasErrors(['email']);
        $this->post('/register', ['name' => 'A', 'email' => 'x@rel.test', 'password' => '123', 'password_confirmation' => '123', 'terms' => true])
            ->assertSessionHasErrors(['password']);
        $this->post('/register', ['name' => 'A', 'email' => 'y@rel.test', 'password' => 'password123', 'password_confirmation' => 'lain123', 'terms' => true])
            ->assertSessionHasErrors(['password']);
        // terms is mandatory (not merely "sometimes")
        $this->post('/register', ['name' => 'A', 'email' => 'z@rel.test', 'password' => 'password123', 'password_confirmation' => 'password123'])
            ->assertSessionHasErrors(['terms']);
        $this->assertNull(User::where('email', 'z@rel.test')->first());
    }

    #[TestDox('R3 UC-05 include UC-09 — pengajuan only for existing ACTIVE catalog items')]
    public function test_r3_ajukan_include_katalog(): void
    {
        $active = $this->product('jasa');
        $inactive = $this->product('jasa', 100000, false);
        $draft = $this->product('produk', 100000, true, 'draft');

        $this->actingAs($this->customer);

        // Catalog is reachable from the submission flow and lists only what is
        // approved + active.
        $this->get(route('customer.pengajuan.create'))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->has('layanan', 1)->where('layanan.0.id', $active->id));

        $this->post(route('customer.pengajuan.store'), ['tipe' => 'jasa', 'product_id' => $active->id, 'keperluan' => 'ok'])
            ->assertRedirect();

        // Deactivated, draft, and non-existent items are rejected.
        $this->post(route('customer.pengajuan.store'), ['tipe' => 'jasa', 'product_id' => $inactive->id, 'keperluan' => 'x'])
            ->assertSessionHasErrors(['product_id']);
        $this->post(route('customer.pengajuan.store'), ['tipe' => 'produk', 'product_id' => $draft->id, 'keperluan' => 'x'])
            ->assertSessionHasErrors(['product_id']);
        $this->post(route('customer.pengajuan.store'), ['tipe' => 'jasa', 'product_id' => 999999, 'keperluan' => 'x'])
            ->assertSessionHasErrors(['product_id']);

        $this->assertSame(1, Pengajuan::where('buyer_id', $this->customer->id)->count());
    }

    #[TestDox('R4 UC-10 include UC-11 + UC-12 — method AND proof both required')]
    public function test_r4_bayar_includes_metode_and_bukti(): void
    {
        Storage::fake('public');
        $this->actingAs($this->customer);
        $p = $this->pengajuan($this->customer, 'Menunggu Pembayaran');
        $metode = MetodePembayaran::firstOrFail();

        // No method chosen -> rejected by the server, status does not advance.
        $this->post(route('customer.pengajuan.proof', $p), ['bukti' => UploadedFile::fake()->image('b.jpg')])
            ->assertSessionHasErrors(['metode_id']);
        // No proof -> rejected by the server, status does not advance.
        $this->post(route('customer.pengajuan.proof', $p), ['metode_id' => $metode->id])
            ->assertSessionHasErrors(['bukti']);
        $this->assertSame('Menunggu Pembayaran', $p->fresh()->status);
        $this->assertNull($p->fresh()->order);

        // Both present -> advances.
        $this->post(route('customer.pengajuan.proof', $p), [
            'metode_id' => $metode->id, 'bukti' => UploadedFile::fake()->image('b.jpg'),
        ])->assertRedirect();
        $this->assertSame('Menunggu Verifikasi Pembayaran', $p->fresh()->status);
    }

    #[TestDox('R5 UC-14 extend UC-15/16, UC-19 extend UC-20/21 — owner + state guards')]
    public function test_r5_ubah_batal_extends(): void
    {
        // Layanan: owner + allowed states only.
        $p = $this->pengajuan($this->customer, 'Diajukan');
        $this->actingAs($this->customer);
        $this->patch(route('customer.pengajuan.update', $p), ['keperluan' => 'revisi'])->assertRedirect();
        $this->patch(route('customer.pengajuan.cancel', $p), [])->assertRedirect();
        $this->assertSame('Dibatalkan', $p->fresh()->status);

        $locked = $this->pengajuan($this->customer, 'Diproses');
        $this->patch(route('customer.pengajuan.update', $locked), ['keperluan' => 'x'])->assertForbidden();
        $this->patch(route('customer.pengajuan.cancel', $locked), [])->assertForbidden();

        $other = $this->pengajuan($this->customer, 'Diajukan');
        $this->actingAs($this->customer2);
        $this->patch(route('customer.pengajuan.update', $other), ['keperluan' => 'x'])->assertForbidden();
        foreach ([$this->pimpinan, $this->direktur, $this->rtpu, $this->p3m] as $staff) {
            $this->actingAs($staff);
            $this->patch(route('customer.pengajuan.update', $other), ['keperluan' => 'x'])->assertForbidden();
        }

        // Produk unggulan: owner + allowed states only.
        $pu = $this->produkUnggulan($this->p3m, 'Diajukan');
        $this->actingAs($this->p3m);
        $this->patch(route('p3m.produk.update', $pu), ['name' => 'Baru'])->assertRedirect();
        $this->patch(route('p3m.produk.cancel', $pu), [])->assertRedirect();
        $this->assertSame('Dibatalkan', $pu->fresh()->status);

        $puLocked = $this->produkUnggulan($this->p3m, 'Disetujui');
        $this->patch(route('p3m.produk.update', $puLocked), ['name' => 'x'])->assertForbidden();
        $this->patch(route('p3m.produk.cancel', $puLocked), [])->assertForbidden();

        $puOther = $this->produkUnggulan($this->p3m, 'Diajukan');
        $this->actingAs($this->p3m2);
        $this->patch(route('p3m.produk.update', $puOther), ['name' => 'x'])->assertForbidden();
        foreach ([$this->pimpinan, $this->direktur, $this->rtpu] as $staff) {
            $this->actingAs($staff);
            $this->patch(route('p3m.produk.update', $puOther), ['name' => 'x'])->assertForbidden();
        }
    }

    #[TestDox('R6 UC-17 include UC-18 — supporting documents are mandatory')]
    public function test_r6_produk_includes_documents(): void
    {
        Storage::fake('public');
        $this->actingAs($this->p3m);

        // Zero documents -> rejected.
        $this->post(route('p3m.produk.store'), ['name' => 'Tanpa Dokumen'])
            ->assertSessionHasErrors(['dokumen']);
        $this->assertSame(0, ProdukUnggulan::where('owner_id', $this->p3m->id)->count());

        // At least one document -> accepted.
        $this->post(route('p3m.produk.store'), [
            'name' => 'Dengan Dokumen',
            'dokumen' => [UploadedFile::fake()->create('proposal.pdf', 100, 'application/pdf')],
        ])->assertRedirect();
        $this->assertSame(1, ProdukUnggulan::where('owner_id', $this->p3m->id)->count());
    }

    #[TestDox('R7 UC-25 include UC-26 / extend UC-27 — reject requires note in all 3 flows')]
    public function test_r7_verifikasi_include_completeness_and_reject_note(): void
    {
        Storage::fake('public');

        // UC-26 completeness checklist is a client-side helper; approving with
        // NO checklist payload succeeds, proving there is no server-side gate.
        $this->actingAs($this->rtpu);
        $p = $this->pengajuan($this->customer, 'Diajukan');
        $this->patch(route('rtpu.verify.layanan.approve', $p))->assertRedirect();

        // UC-27: every reject flow requires a non-empty note.
        $q = $this->pengajuan($this->customer, 'Diajukan');
        $this->patch(route('rtpu.verify.layanan.reject', $q), [])->assertSessionHasErrors(['catatan']);
        $this->assertSame('Diajukan', $q->fresh()->status);
        $this->patch(route('rtpu.verify.layanan.reject', $q), ['catatan' => 'Lengkap? kurang.'])->assertRedirect();
        $this->assertSame('Ditolak', $q->fresh()->status);
        // requester can see the note
        $this->actingAs($this->customer);
        $this->get(route('customer.pengajuan.show', $q))->assertOk()
            ->assertInertia(fn (Assert $pg) => $pg->where('item.note', 'Lengkap? kurang.'));

        // Payment reject requires a note.
        $this->actingAs($this->customer);
        $pay = $this->pengajuan($this->customer, 'Menunggu Pembayaran');
        $this->post(route('customer.pengajuan.proof', $pay), [
            'metode_id' => MetodePembayaran::firstOrFail()->id,
            'bukti' => UploadedFile::fake()->image('b.jpg'),
        ]);
        $proof = $pay->fresh()->order->paymentProofs()->firstOrFail();
        $this->actingAs($this->rtpu);
        $this->patch(route('rtpu.verify.bayar.reject', $proof->id), [])->assertSessionHasErrors(['catatan']);

        // Produk unggulan reject requires a note.
        $pu = $this->produkUnggulan($this->p3m, 'Diajukan');
        $this->actingAs($this->pimpinan);
        $this->patch(route('pimpinan.verify.reject', $pu), [])->assertSessionHasErrors(['catatan']);
        $this->assertSame('Diajukan', $pu->fresh()->status);
    }

    #[TestDox('R8 UC-32 include UC-33; UC-34/35/36 extend — CRUD per entity')]
    public function test_r8_master_data_crud(): void
    {
        // Admin RTPU: Metode + Layanan Jasa/Ruangan/Produk.
        $this->actingAs($this->rtpu);
        $this->get(route('rtpu.metode'))->assertOk();                                  // UC-33
        $this->post(route('rtpu.metode.store'), ['name' => 'VA', 'type' => 'VA', 'account' => '1', 'holder' => 'PNJ'])->assertRedirect(); // UC-34
        $metode = MetodePembayaran::where('nama', 'VA')->firstOrFail();
        $this->patch(route('rtpu.metode.update', $metode), ['name' => 'VA', 'type' => 'VA', 'account' => '2', 'holder' => 'PNJ'])->assertRedirect(); // UC-35
        $this->assertSame('2', $metode->fresh()->rekening);

        $this->get(route('rtpu.layanan'))->assertOk();
        foreach (['jasa', 'ruangan', 'produk'] as $tipe) {
            $this->post(route('rtpu.layanan.store'), ['tipe' => $tipe, 'name' => 'Uji '.$tipe, 'price' => 1000])->assertRedirect();
        }
        $layanan = Product::where('name', 'Uji jasa')->firstOrFail();
        $this->patch(route('rtpu.layanan.update', $layanan), ['tipe' => 'jasa', 'name' => 'Uji jasa 2', 'price' => 2000])->assertRedirect();
        $this->assertSame('Uji jasa 2', $layanan->fresh()->name);
        $this->delete(route('rtpu.layanan.destroy', $layanan))->assertRedirect();       // UC-36
        $this->assertSoftDeleted('products', ['id' => $layanan->id]);

        // Super Admin: User, Fitur, and the Hak Akses matrix editor.
        $this->actingAs($this->superadmin);
        $this->post(route('superadmin.users.store'), ['name' => 'U', 'email' => 'u@rel.test', 'password' => 'password123', 'role' => 'customer'])->assertRedirect();
        $u = User::where('email', 'u@rel.test')->firstOrFail();
        $this->patch(route('superadmin.users.update', $u), ['name' => 'U2', 'email' => 'u@rel.test', 'role' => 'customer'])->assertRedirect();
        $this->delete(route('superadmin.users.destroy', $u))->assertRedirect();

        $this->post(route('superadmin.fitur.store'), ['name' => 'X', 'key' => 'x-fit'])->assertRedirect();
        $this->patch(route('superadmin.fitur.update', 'x-fit'), ['name' => 'X2'])->assertRedirect();
        $this->delete(route('superadmin.fitur.destroy', 'x-fit'))->assertRedirect();

        // Hak Akses: add/edit/delete are realized by saving the whole matrix
        // (there is no per-cell route). Saving toggles a cell's stored value.
        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['admin_p3m' => ['produk-unggulan' => ['Lihat' => true, 'Tambah' => false]]],
        ])->assertRedirect();
        $this->assertFalse((bool) Permission::where('role', 'admin_p3m')
            ->where('fitur_key', 'produk-unggulan')->where('aksi', 'Tambah')->value('allowed'));
        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['admin_p3m' => ['produk-unggulan' => ['Lihat' => true, 'Tambah' => true]]],
        ])->assertRedirect();
        $this->assertTrue((bool) Permission::where('role', 'admin_p3m')
            ->where('fitur_key', 'produk-unggulan')->where('aksi', 'Tambah')->value('allowed'));
    }

    #[TestDox('R9 UC-22/23/24 — stream separation; closed items in history')]
    public function test_r9_riwayat_streams(): void
    {
        $open = $this->pengajuan($this->customer, 'Diajukan');
        $closed = $this->pengajuan($this->customer, 'Selesai');
        $pu = $this->produkUnggulan($this->p3m, 'Disetujui');

        // Customer history = transaksi layanan, closed only.
        $this->actingAs($this->customer);
        $this->get(route('customer.riwayat'))->assertInertia(fn (Assert $p) => $p
            ->has('riwayat', 1)->where('riwayat.0.code', $closed->code));

        // Admin RTPU history = layanan stream only.
        $this->actingAs($this->rtpu);
        $this->get(route('rtpu.riwayat'))->assertInertia(fn (Assert $p) => $p->has('riwayat', 2));

        // Admin P3M / Pimpinan history = produk unggulan stream only.
        $this->actingAs($this->p3m);
        $this->get(route('p3m.riwayat'))->assertInertia(fn (Assert $p) => $p
            ->has('riwayat', 1)->where('riwayat.0.id', $pu->id));
        $this->actingAs($this->pimpinan);
        $this->get(route('pimpinan.riwayat'))->assertInertia(fn (Assert $p) => $p->has('produk', 1));

        // Direktur history = BOTH streams (read-only).
        $this->actingAs($this->direktur);
        $this->get(route('direktur.riwayat'))->assertInertia(fn (Assert $p) => $p
            ->has('produk', 1)->has('layanan', 2));

        printf("[INFO] admin_rtpu riwayat rows=%d (includes in-progress: %s)\n", 2, $open->status);
    }

    #[TestDox('R10 UC-13/14/19 — monitoring scopes (own / stream / both)')]
    public function test_r10_monitoring_scopes(): void
    {
        $open = $this->pengajuan($this->customer, 'Diajukan');
        $this->pengajuan($this->customer, 'Selesai');
        $this->pengajuan($this->customer2, 'Diajukan');
        $pu = $this->produkUnggulan($this->p3m, 'Diajukan');
        $this->produkUnggulan($this->p3m, 'Disetujui');

        // Customer: own, in-progress only.
        $this->actingAs($this->customer);
        $this->get(route('customer.pengajuan.index'))->assertInertia(fn (Assert $p) => $p
            ->has('pengajuan', 1)->where('pengajuan.0.code', $open->code));

        // Admin P3M: own produk stream (Pemantauan = not yet decided).
        $this->actingAs($this->p3m);
        $this->get(route('p3m.produk.index'))->assertInertia(fn (Assert $p) => $p
            ->has('daftar', 1)->where('daftar.0.id', $pu->id));

        // Pimpinan: whole produk stream.
        $this->actingAs($this->pimpinan);
        $this->get(route('pimpinan.monitor'))->assertInertia(fn (Assert $p) => $p->has('produk', 2));

        // Direktur: both streams, no action buttons backed by routes.
        $this->actingAs($this->direktur);
        $this->get(route('direktur.monitor'))->assertInertia(fn (Assert $p) => $p
            ->has('produk', 2)->has('layanan', 3));
    }

    #[TestDox('R11 UC-31 Memperbarui Status Layanan — forward only + history row')]
    public function test_r11_status_transitions(): void
    {
        $p = $this->pengajuan($this->customer, 'Diproses');

        // Non-RTPU actors cannot update the status.
        foreach ([$this->pimpinan, $this->p3m, $this->direktur, $this->customer] as $u) {
            $this->actingAs($u);
            $this->patch(route('rtpu.status.update', $p), ['status' => 'Selesai'])->assertForbidden();
        }

        $this->actingAs($this->rtpu);
        // Backward / invalid transition rejected by validation.
        $this->patch(route('rtpu.status.update', $p), ['status' => 'Diajukan'])->assertSessionHasErrors(['status']);
        $this->patch(route('rtpu.status.update', $p), ['status' => 'Menunggu Pembayaran'])->assertSessionHasErrors(['status']);
        $this->assertSame('Diproses', $p->fresh()->status);

        // Valid forward transition writes a history row.
        $this->patch(route('rtpu.status.update', $p), ['status' => 'Selesai', 'catatan' => 'Serah terima.'])
            ->assertRedirect();
        $p->refresh();
        $this->assertSame('Selesai', $p->status);
        $last = $p->history[count($p->history) - 1];
        $this->assertSame('Diproses', $last['from']);
        $this->assertSame('Selesai', $last['status']);
        $this->assertSame('Serah terima.', $last['note']);
        $this->assertNotEmpty($last['by']);
    }
}

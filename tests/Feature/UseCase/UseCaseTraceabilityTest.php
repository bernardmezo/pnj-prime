<?php

namespace Tests\Feature\UseCase;

use App\Models\MetodePembayaran;
use App\Models\Pengajuan;
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
 * CHECK A — use case → implementation traceability.
 *
 * One test per use case (children of an abstract parent are grouped). Each
 * test exercises the main route/endpoint of the use case for the actor the
 * diagram associates with it, so the test list doubles as the traceability
 * record. Authorization details live in ActorAccessMatrixTest.
 */
class UseCaseTraceabilityTest extends TestCase
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

        $this->customer = User::factory()->customer()->create(['email' => 'c1@uc.test']);
        $this->customer2 = User::factory()->customer()->create(['email' => 'c2@uc.test']);
        $this->rtpu = User::factory()->adminRtpu()->create(['email' => 'rtpu@uc.test']);
        $this->p3m = User::factory()->adminP3m()->create(['email' => 'p3m@uc.test']);
        $this->p3m2 = User::factory()->adminP3m()->create(['email' => 'p3mb@uc.test']);
        $this->pimpinan = User::factory()->pimpinanRtpu()->create(['email' => 'pim@uc.test']);
        $this->direktur = User::factory()->direktur()->create(['email' => 'dir@uc.test']);
        $this->superadmin = User::factory()->superAdmin()->create(['email' => 'sa@uc.test']);
    }

    private function product(string $tipe = 'jasa', int $price = 100000, bool $active = true): Product
    {
        $slug = ['jasa' => 'jasa-layanan', 'ruangan' => 'sewa-fasilitas', 'produk' => 'produk-fisik'][$tipe];

        return Product::create([
            'owner_id' => $this->rtpu->id,
            'category_id' => ProductCategory::where('slug', $slug)->firstOrFail()->id,
            'name' => 'Layanan '.$tipe.' '.uniqid(),
            'slug' => 'layanan-'.$tipe.'-'.uniqid(),
            'base_price' => $price,
            'final_price' => $price,
            'curation_status' => 'approved',
            'is_active' => $active,
        ]);
    }

    private function pengajuan(User $owner, string $status = 'Diajukan', string $tipe = 'jasa'): Pengajuan
    {
        return Pengajuan::create([
            'code' => 'PNJ-T-'.uniqid(),
            'buyer_id' => $owner->id,
            'tipe' => $tipe,
            'keperluan' => 'Butuh',
            'jumlah' => '1',
            'status' => $status,
            'history' => [['from' => null, 'status' => $status, 'at' => now()->format('Y-m-d H:i'), 'note' => null, 'by' => null]],
        ]);
    }

    private function produkUnggulan(User $owner, string $status = 'Diajukan'): ProdukUnggulan
    {
        return ProdukUnggulan::create([
            'code' => 'PNJ-PU-'.uniqid(),
            'owner_id' => $owner->id,
            'name' => 'PU '.uniqid(),
            'status' => $status,
            'history' => [],
        ]);
    }

    #[TestDox('UC-01 Melakukan Login — all six actors land on a dashboard')]
    public function test_uc01_login_all_six_actors(): void
    {
        foreach ([$this->customer, $this->rtpu, $this->p3m, $this->pimpinan, $this->direktur, $this->superadmin] as $u) {
            $this->post('/login', ['email' => $u->email, 'password' => 'password'])
                ->assertRedirect(route('dashboard', absolute: false));
            $this->get('/dashboard')->assertOk();
            $this->post(route('logout'));
        }
    }

    #[TestDox('UC-02 Memverifikasi Kredensial — include of UC-01, bad credentials rejected')]
    public function test_uc02_credential_verification(): void
    {
        $this->get(route('login'))->assertOk()->assertInertia(fn (Assert $p) => $p->component('Auth/Login'));

        $this->post('/login', ['email' => 'c1@uc.test', 'password' => 'salah'])
            ->assertSessionHasErrors(['email' => trans('auth.failed')]);
        $this->assertGuest();
    }

    #[TestDox('UC-03 + UC-04 Mendaftar Akun / Memvalidasi Data Registrasi')]
    public function test_uc03_uc04_register(): void
    {
        $this->get(route('register'))->assertOk()->assertInertia(fn (Assert $p) => $p->component('Auth/Register'));

        $this->post('/register', [
            'name' => 'Pendaftar', 'email' => 'daftar@uc.test',
            'password' => 'password123', 'password_confirmation' => 'password123',
            'terms' => true, 'role' => 'super_admin',
        ])->assertRedirect(route('dashboard', absolute: false));

        $u = User::where('email', 'daftar@uc.test')->firstOrFail();
        $this->assertSame('customer', $u->role);
        $this->assertAuthenticatedAs($u);
    }

    #[TestDox('UC-05/06/07/08 Mengajukan Layanan (Jasa/Ruangan/Produk)')]
    public function test_uc05_to_uc08_ajukan_layanan(): void
    {
        $this->actingAs($this->customer);
        $this->get(route('customer.pengajuan.create'))->assertOk();

        foreach (['jasa', 'ruangan', 'produk'] as $tipe) {
            $this->post(route('customer.pengajuan.store'), [
                'tipe' => $tipe, 'keperluan' => 'Butuh '.$tipe, 'jumlah' => '1',
            ])->assertRedirect();
        }

        $this->assertSame(3, Pengajuan::where('buyer_id', $this->customer->id)->count());
    }

    #[TestDox('UC-09 Melihat Katalog Layanan — list + detail')]
    public function test_uc09_katalog(): void
    {
        $p = $this->product('jasa');
        $this->get('/katalog')->assertOk();
        $this->get(route('catalog.show', $p->slug))->assertOk();
    }

    #[TestDox('UC-10/11/12 Melakukan Pembayaran (metode + bukti)')]
    public function test_uc10_to_uc12_pembayaran(): void
    {
        Storage::fake('public');
        $this->actingAs($this->customer);
        $p = $this->pengajuan($this->customer, 'Menunggu Pembayaran');

        $page = $this->get(route('customer.pengajuan.bayar', $p))->assertOk();
        $page->assertInertia(fn (Assert $pg) => $pg->has('metode', 1)->where('metode.0.name', 'Mandiri BLU PNJ'));

        $this->post(route('customer.pengajuan.proof', $p), [
            'metode_id' => MetodePembayaran::firstOrFail()->id,
            'bukti' => UploadedFile::fake()->image('bukti.jpg'),
        ])->assertRedirect();

        $this->assertSame('Menunggu Verifikasi Pembayaran', $p->fresh()->status);
    }

    #[TestDox('UC-13 Memantau Status Pengajuan — Direktur sees BOTH streams')]
    public function test_uc13_direktur_monitors_both(): void
    {
        $this->pengajuan($this->customer, 'Diajukan');
        $this->produkUnggulan($this->p3m, 'Diajukan');

        $this->actingAs($this->direktur);
        $this->get(route('direktur.monitor'))->assertOk()->assertInertia(fn (Assert $p) => $p
            ->has('produk', 1)
            ->has('layanan', 1)
        );
    }

    #[TestDox('UC-14 Memantau Pengajuan Layanan — Customer sees own in-progress only')]
    public function test_uc14_pemantauan_layanan(): void
    {
        $open = $this->pengajuan($this->customer, 'Diajukan');
        $closed = $this->pengajuan($this->customer, 'Selesai');
        $this->pengajuan($this->customer2, 'Diajukan');

        $this->actingAs($this->customer);
        $this->get(route('customer.pengajuan.index'))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->has('pengajuan', 1)->where('pengajuan.0.code', $open->code));
        $this->assertNotSame($closed->code, $open->code);
    }

    #[TestDox('UC-15 Mengubah Pengajuan Layanan')]
    public function test_uc15_ubah_layanan(): void
    {
        $p = $this->pengajuan($this->customer, 'Diajukan');
        $this->actingAs($this->customer);
        $this->get(route('customer.pengajuan.edit', $p))->assertOk();
        $this->patch(route('customer.pengajuan.update', $p), ['keperluan' => 'Revisi'])
            ->assertRedirect();
        $this->assertSame('Revisi', $p->fresh()->keperluan);
    }

    #[TestDox('UC-16 Membatalkan Pengajuan Layanan')]
    public function test_uc16_batal_layanan(): void
    {
        $p = $this->pengajuan($this->customer, 'Diajukan');
        $this->actingAs($this->customer);
        $this->patch(route('customer.pengajuan.cancel', $p), ['alasan' => 'Batal'])->assertRedirect();
        $this->assertSame('Dibatalkan', $p->fresh()->status);
    }

    #[TestDox('UC-17 Mengajukan Produk Unggulan')]
    public function test_uc17_ajukan_produk_unggulan(): void
    {
        Storage::fake('public');
        $this->actingAs($this->p3m);
        $this->get(route('p3m.produk.index'))->assertOk();

        $this->post(route('p3m.produk.store'), [
            'name' => 'Kompor Biomassa', 'researcher' => 'Dr. A',
            'dokumen' => [UploadedFile::fake()->create('proposal.pdf', 100, 'application/pdf')],
        ])->assertRedirect();

        $pu = ProdukUnggulan::where('owner_id', $this->p3m->id)->firstOrFail();
        $this->assertSame('Diajukan', $pu->status);
    }

    #[TestDox('UC-18 Mengunggah Dokumen Pendukung')]
    public function test_uc18_unggah_dokumen(): void
    {
        Storage::fake('public');
        $this->actingAs($this->p3m);
        $this->post(route('p3m.produk.store'), [
            'name' => 'Produk Berkas',
            'dokumen' => [UploadedFile::fake()->create('foto.png', 100, 'image/png')],
        ])->assertRedirect();

        $pu = ProdukUnggulan::where('owner_id', $this->p3m->id)->firstOrFail();
        $this->assertCount(1, $pu->documents);
        $this->get(route('berkas.show', ['kind' => 'produk-dokumen', 'id' => $pu->id, 'index' => 0]))->assertOk();
    }

    #[TestDox('UC-19 Memantau Pengajuan Produk Unggulan — Admin P3M own stream')]
    public function test_uc19_p3m_monitor(): void
    {
        $mine = $this->produkUnggulan($this->p3m, 'Diajukan');
        $this->produkUnggulan($this->p3m2, 'Diajukan');

        $this->actingAs($this->p3m);
        $this->get(route('p3m.produk.index'))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->has('daftar', 1)->where('daftar.0.id', $mine->id));
    }

    #[TestDox('UC-20 Mengubah Pengajuan Produk Unggulan')]
    public function test_uc20_ubah_produk(): void
    {
        $pu = $this->produkUnggulan($this->p3m, 'Diajukan');
        $this->actingAs($this->p3m);
        $this->get(route('p3m.produk.edit', $pu))->assertOk();
        $this->patch(route('p3m.produk.update', $pu), ['name' => 'Nama Baru'])->assertRedirect();
        $this->assertSame('Nama Baru', $pu->fresh()->name);
    }

    #[TestDox('UC-21 Membatalkan Pengajuan Produk Unggulan')]
    public function test_uc21_batal_produk(): void
    {
        $pu = $this->produkUnggulan($this->p3m, 'Diajukan');
        $this->actingAs($this->p3m);
        $this->patch(route('p3m.produk.cancel', $pu), ['alasan' => 'Batal'])->assertRedirect();
        $this->assertSame('Dibatalkan', $pu->fresh()->status);
    }

    #[TestDox('UC-22 Melihat Riwayat — Direktur sees BOTH streams')]
    public function test_uc22_direktur_riwayat(): void
    {
        $this->pengajuan($this->customer, 'Selesai');
        $this->produkUnggulan($this->p3m, 'Disetujui');

        $this->actingAs($this->direktur);
        $this->get(route('direktur.riwayat'))->assertOk()->assertInertia(fn (Assert $p) => $p
            ->has('produk', 1)
            ->has('layanan', 1)
        );
    }

    #[TestDox('UC-23 Melihat Riwayat Transaksi Layanan — Customer own + Admin RTPU all')]
    public function test_uc23_riwayat_layanan(): void
    {
        $closed = $this->pengajuan($this->customer, 'Selesai');
        $this->pengajuan($this->customer2, 'Selesai');

        $this->actingAs($this->customer);
        $this->get(route('customer.riwayat'))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->has('riwayat', 1)->where('riwayat.0.code', $closed->code));

        $this->actingAs($this->rtpu);
        $this->get(route('rtpu.riwayat'))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->has('riwayat', 2));
    }

    #[TestDox('UC-24 Melihat Riwayat Produk Unggulan — Admin P3M own / Pimpinan all')]
    public function test_uc24_riwayat_produk(): void
    {
        $this->produkUnggulan($this->p3m, 'Disetujui');
        $this->produkUnggulan($this->p3m2, 'Disetujui');

        $this->actingAs($this->p3m);
        $this->get(route('p3m.riwayat'))->assertOk()->assertInertia(fn (Assert $p) => $p->has('riwayat', 1));

        $this->actingAs($this->pimpinan);
        $this->get(route('pimpinan.riwayat'))->assertOk()->assertInertia(fn (Assert $p) => $p->has('produk', 2));
    }

    #[TestDox('UC-25/26/27 Memverifikasi Data — completeness (UI) + reject with note')]
    public function test_uc25_to_uc27_verifikasi_data(): void
    {
        $p = $this->pengajuan($this->customer, 'Diajukan');
        $this->actingAs($this->rtpu);

        // Completeness checklist is a client-side helper: approval needs no
        // extra payload, proving no server-side completeness gate exists.
        $this->patch(route('rtpu.verify.layanan.approve', $p))->assertRedirect();
        $this->assertSame('Menunggu Pembayaran', $p->fresh()->status);

        // Rejecting REQUIRES a note (Menolak dan Memberi Catatan).
        $q = $this->pengajuan($this->customer, 'Diajukan');
        $this->patch(route('rtpu.verify.layanan.reject', $q), [])->assertSessionHasErrors(['catatan']);
        $this->assertSame('Diajukan', $q->fresh()->status);
    }

    #[TestDox('UC-28 Memverifikasi Pengajuan Layanan — Admin RTPU')]
    public function test_uc28_verifikasi_layanan(): void
    {
        $p = $this->pengajuan($this->customer, 'Diajukan');
        $this->actingAs($this->rtpu);
        $this->get(route('rtpu.verify.layanan'))->assertOk();
        $this->patch(route('rtpu.verify.layanan.approve', $p))->assertRedirect();
        $this->assertSame('Menunggu Pembayaran', $p->fresh()->status);
        $this->assertNotNull($p->fresh()->order);
    }

    #[TestDox('UC-29 Memverifikasi Pembayaran — Admin RTPU')]
    public function test_uc29_verifikasi_pembayaran(): void
    {
        Storage::fake('public');
        $this->actingAs($this->customer);
        $p = $this->pengajuan($this->customer, 'Menunggu Pembayaran');
        $this->post(route('customer.pengajuan.proof', $p), [
            'metode_id' => MetodePembayaran::firstOrFail()->id,
            'bukti' => UploadedFile::fake()->image('b.jpg'),
        ]);
        $proof = $p->fresh()->order->paymentProofs()->firstOrFail();

        $this->actingAs($this->rtpu);
        $this->get(route('rtpu.verify.bayar'))->assertOk();
        $this->patch(route('rtpu.verify.bayar.accept', $proof->id))->assertRedirect();
        $this->assertSame('Diproses', $p->fresh()->status);
    }

    #[TestDox('UC-30 Memverifikasi Pengajuan Produk Unggulan — Pimpinan RTPU')]
    public function test_uc30_verifikasi_produk(): void
    {
        $pu = $this->produkUnggulan($this->p3m, 'Diajukan');
        $this->actingAs($this->pimpinan);
        $this->get(route('pimpinan.verify'))->assertOk();
        $this->patch(route('pimpinan.verify.approve', $pu))->assertRedirect();
        $this->assertSame('Disetujui', $pu->fresh()->status);
    }

    #[TestDox('UC-31 Memperbarui Status Layanan — Admin RTPU, forward only')]
    public function test_uc31_status_layanan(): void
    {
        $p = $this->pengajuan($this->customer, 'Diproses');
        $this->actingAs($this->rtpu);
        $this->get(route('rtpu.status'))->assertOk();
        $this->patch(route('rtpu.status.update', $p), ['status' => 'Selesai'])->assertRedirect();
        $this->assertSame('Selesai', $p->fresh()->status);
    }

    #[TestDox('UC-32/33 Mengelola Data Master — list every managed entity')]
    public function test_uc32_uc33_list_data(): void
    {
        $this->actingAs($this->rtpu);
        $this->get(route('rtpu.metode'))->assertOk();
        $this->get(route('rtpu.layanan'))->assertOk();

        $this->actingAs($this->superadmin);
        $this->get(route('superadmin.users'))->assertOk();
        $this->get(route('superadmin.hakakses'))->assertOk();
        $this->get(route('superadmin.fitur'))->assertOk();
    }

    #[TestDox('UC-34 Menambah Data')]
    public function test_uc34_tambah_data(): void
    {
        $this->actingAs($this->rtpu);
        $this->post(route('rtpu.metode.store'), [
            'name' => 'VA Bank', 'type' => 'Virtual Account', 'account' => '123', 'holder' => 'PNJ',
        ])->assertRedirect();
        $this->post(route('rtpu.layanan.store'), [
            'tipe' => 'jasa', 'name' => 'Layanan Baru', 'price' => 50000,
        ])->assertRedirect();

        $this->actingAs($this->superadmin);
        $this->post(route('superadmin.users.store'), [
            'name' => 'Staf', 'email' => 'staf@uc.test', 'password' => 'password123', 'role' => 'admin_p3m',
        ])->assertRedirect();
        $this->post(route('superadmin.fitur.store'), [
            'name' => 'Modul Uji', 'key' => 'modul-uji',
        ])->assertRedirect();

        $this->assertDatabaseHas('metode_pembayaran', ['nama' => 'VA Bank']);
        $this->assertDatabaseHas('products', ['name' => 'Layanan Baru']);
        $this->assertDatabaseHas('users', ['email' => 'staf@uc.test']);
        $this->assertDatabaseHas('fitur', ['key' => 'modul-uji']);
    }

    #[TestDox('UC-35 Mengubah Data')]
    public function test_uc35_ubah_data(): void
    {
        $this->actingAs($this->rtpu);
        $metode = MetodePembayaran::firstOrFail();
        $this->patch(route('rtpu.metode.update', $metode), [
            'name' => $metode->nama, 'type' => $metode->tipe, 'account' => '999', 'holder' => $metode->holder,
        ])->assertRedirect();
        $this->assertSame('999', $metode->fresh()->rekening);
    }

    #[TestDox('UC-36 Menghapus Data')]
    public function test_uc36_hapus_data(): void
    {
        $this->actingAs($this->rtpu);
        $p = $this->product('jasa');
        $this->delete(route('rtpu.layanan.destroy', $p))->assertRedirect();
        $this->assertSoftDeleted('products', ['id' => $p->id]);
    }

    #[TestDox('UC-37 Mengelola Metode Pembayaran — Admin RTPU CRUD')]
    public function test_uc37_metode_crud(): void
    {
        $this->actingAs($this->rtpu);
        $this->get(route('rtpu.metode'))->assertOk();
        $this->post(route('rtpu.metode.store'), [
            'name' => 'QRIS', 'type' => 'QRIS', 'account' => '-', 'holder' => 'PNJ',
        ])->assertRedirect();

        $qris = MetodePembayaran::where('nama', 'QRIS')->firstOrFail();
        $this->patch(route('rtpu.metode.update', $qris), [
            'name' => 'QRIS', 'type' => 'QRIS', 'account' => '-', 'holder' => 'PNJ', 'active' => false,
        ])->assertRedirect();
        $this->assertFalse((bool) $qris->fresh()->aktif);

        $this->delete(route('rtpu.metode.destroy', $qris))->assertRedirect();
        $this->assertDatabaseMissing('metode_pembayaran', ['id' => $qris->id]);
    }

    #[TestDox('UC-38/39/40/41 Mengelola Layanan Jasa/Ruangan/Produk — Admin RTPU')]
    public function test_uc38_to_uc41_layanan(): void
    {
        $this->actingAs($this->rtpu);
        foreach (['jasa', 'ruangan', 'produk'] as $tipe) {
            $this->get(route('rtpu.layanan.form', ['tipe' => $tipe]))->assertOk();
            $this->post(route('rtpu.layanan.store'), [
                'tipe' => $tipe, 'name' => 'Kelola '.$tipe, 'price' => 10000,
            ])->assertRedirect();
        }
        $this->assertSame(3, Product::where('name', 'like', 'Kelola %')->count());
    }

    #[TestDox('UC-42 Mengelola User — Super Admin')]
    public function test_uc42_kelola_user(): void
    {
        $this->actingAs($this->superadmin);
        $this->get(route('superadmin.users'))->assertOk();
        $this->post(route('superadmin.users.store'), [
            'name' => 'Baru', 'email' => 'baru@uc.test', 'password' => 'password123', 'role' => 'customer',
        ])->assertRedirect();
        $u = User::where('email', 'baru@uc.test')->firstOrFail();
        $this->patch(route('superadmin.users.update', $u), [
            'name' => 'Baru 2', 'email' => 'baru@uc.test', 'role' => 'customer', 'active' => false,
        ])->assertRedirect();
        $this->assertFalse((bool) $u->fresh()->is_active);
        $this->delete(route('superadmin.users.destroy', $u))->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $u->id]);
    }

    #[TestDox('UC-43 Mengelola Hak Akses — Super Admin matrix editor')]
    public function test_uc43_kelola_hak_akses(): void
    {
        $this->actingAs($this->superadmin);
        $this->get(route('superadmin.hakakses'))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->has('fitur')->has('matriks'));

        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['admin_p3m' => ['produk-unggulan' => ['Lihat' => true, 'Tambah' => false]]],
        ])->assertRedirect();

        $this->assertDatabaseHas('permissions', [
            'role' => 'admin_p3m', 'fitur_key' => 'produk-unggulan', 'aksi' => 'Tambah', 'allowed' => false,
        ]);
    }

    #[TestDox('UC-44 Mengelola Fitur — Super Admin')]
    public function test_uc44_kelola_fitur(): void
    {
        $this->actingAs($this->superadmin);
        $this->get(route('superadmin.fitur'))->assertOk();
        $this->post(route('superadmin.fitur.store'), ['name' => 'Uji Fitur', 'key' => 'uji-fitur'])
            ->assertRedirect();
        $this->assertDatabaseHas('fitur', ['key' => 'uji-fitur']);
        $this->delete(route('superadmin.fitur.destroy', 'uji-fitur'))->assertRedirect();
        $this->assertDatabaseMissing('fitur', ['key' => 'uji-fitur']);
    }
}

<?php

namespace Tests\Feature\Flow;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UsecaseFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected User $customer2;

    protected User $rtpu;

    protected User $p3m;

    protected User $pimpinan;

    protected User $direktur;

    protected User $superadmin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([ProductCategorySeeder::class, UsecaseSeeder::class]);

        $this->customer = User::factory()->customer()->create(['email' => 'c1@test.id']);
        $this->customer2 = User::factory()->customer()->create(['email' => 'c2@test.id']);
        $this->rtpu = User::factory()->adminRtpu()->create(['email' => 'rtpu@test.id']);
        $this->p3m = User::factory()->adminP3m()->create(['email' => 'p3m@test.id']);
        $this->pimpinan = User::factory()->pimpinanRtpu()->create(['email' => 'pim@test.id']);
        $this->direktur = User::factory()->direktur()->create(['email' => 'dir@test.id']);
        $this->superadmin = User::factory()->superAdmin()->create(['email' => 'sa@test.id']);
    }

    private function product(string $tipe = 'jasa'): Product
    {
        $slug = ['jasa' => 'jasa-layanan', 'ruangan' => 'sewa-fasilitas', 'produk' => 'produk-fisik'][$tipe];

        return Product::create([
            'owner_id' => $this->rtpu->id,
            'category_id' => ProductCategory::where('slug', $slug)->first()->id,
            'name' => "Layanan {$tipe} uji",
            'slug' => "layanan-{$tipe}-uji-".uniqid(),
            'base_price' => 100000,
            'final_price' => 100000,
            'curation_status' => 'approved',
            'is_active' => true,
        ]);
    }

    private function pengajuan(User $owner, string $status = 'Diajukan', string $tipe = 'jasa'): Pengajuan
    {
        return Pengajuan::create([
            'code' => 'PNJ-T-'.uniqid(),
            'buyer_id' => $owner->id,
            'tipe' => $tipe,
            'keperluan' => 'Kebutuhan uji',
            'jumlah' => '1',
            'status' => $status,
            'history' => [['from' => null, 'status' => $status, 'at' => now()->format('Y-m-d H:i'), 'note' => null, 'by' => null]],
        ]);
    }

    // ---------- S1: registrasi & login ----------

    public function test_register_validation_errors(): void
    {
        $this->post('/register', [])->assertSessionHasErrors(['name', 'email', 'password']);
        $this->post('/register', ['name' => 'A', 'email' => 'bukan-email', 'password' => 'password', 'password_confirmation' => 'password'])
            ->assertSessionHasErrors(['email']);
        User::factory()->create(['email' => 'dupe@test.id']);
        $this->post('/register', ['name' => 'A', 'email' => 'dupe@test.id', 'password' => 'password', 'password_confirmation' => 'password'])
            ->assertSessionHasErrors(['email']);
        $this->post('/register', ['name' => 'A', 'email' => 'pendek@test.id', 'password' => '123', 'password_confirmation' => '123'])
            ->assertSessionHasErrors(['password']);
        $this->post('/register', ['name' => 'A', 'email' => 'bedabeda@test.id', 'password' => 'password123', 'password_confirmation' => 'lain123'])
            ->assertSessionHasErrors(['password']);
        $this->post('/register', ['name' => 'A', 'email' => 'terms@test.id', 'password' => 'password123', 'password_confirmation' => 'password123', 'terms' => false])
            ->assertSessionHasErrors(['terms']);
    }

    public function test_register_persists_fields_as_customer(): void
    {
        $this->post('/register', [
            'name' => 'Calon Customer', 'email' => 'baru@test.id',
            'password' => 'password123', 'password_confirmation' => 'password123',
            'user_type' => 'Industri/Perusahaan', 'institution' => 'PT X', 'phone' => '0811',
            'nik_npwp' => '123', 'terms' => true, 'role' => 'super_admin',
        ])->assertRedirect(route('dashboard', absolute: false));

        $u = User::where('email', 'baru@test.id')->firstOrFail();
        $this->assertSame('customer', $u->role); // staff cannot self-register
        $this->assertSame('Industri/Perusahaan', $u->user_type);
        $this->assertSame('123', $u->nik_npwp);
        $this->assertSame('PT X', $u->institution);
        $this->assertAuthenticatedAs($u);
    }

    public function test_login_wrong_credentials_shows_error(): void
    {
        $this->post('/login', ['email' => 'c1@test.id', 'password' => 'salah-salah'])
            ->assertSessionHasErrors(['email']);
        $this->assertGuest();
    }

    public function test_inactive_user_cannot_login(): void
    {
        $this->customer->update(['is_active' => false]);
        $this->post('/login', ['email' => 'c1@test.id', 'password' => 'password'])
            ->assertSessionHasErrors(['email']);
        $this->assertGuest();
    }

    public function test_each_role_lands_on_dashboard(): void
    {
        foreach ([$this->customer, $this->rtpu, $this->p3m, $this->pimpinan, $this->direktur, $this->superadmin] as $u) {
            $this->post('/login', ['email' => $u->email, 'password' => 'password'])
                ->assertRedirect(route('dashboard', absolute: false));
            $this->get('/dashboard')->assertOk();
            $this->post(route('logout'));
        }
    }

    // ---------- S2: katalog ----------

    public function test_catalog_lists_only_approved_active(): void
    {
        $ok = $this->product('jasa');
        $off = $this->product('jasa');
        $off->update(['is_active' => false]);
        $draft = $this->product('produk');
        $draft->update(['curation_status' => 'draft']);

        $this->get('/katalog')->assertOk()->assertInertia(fn ($p) => $p->has('products')
        );
        $this->get(route('catalog.show', $ok->slug))->assertOk();
        $this->get(route('catalog.show', $off->slug))->assertNotFound();
        $this->get(route('catalog.show', $draft->slug))->assertNotFound();
    }

    public function test_catalog_filter_by_tipe(): void
    {
        $this->product('jasa');
        $this->product('ruangan');
        $cat = ProductCategory::where('slug', 'jasa-layanan')->first();
        $this->get('/katalog?category='.$cat->slug)->assertOk();
    }

    // ---------- S3: ajukan layanan ----------

    public function test_customer_creates_pengajuan_all_tipes(): void
    {
        $this->actingAs($this->customer);
        foreach (['jasa', 'ruangan', 'produk'] as $tipe) {
            $res = $this->post(route('customer.pengajuan.store'), [
                'tipe' => $tipe, 'keperluan' => 'Butuh', 'jumlah' => '2',
                'tanggal' => now()->addDays(3)->format('Y-m-d'),
            ]);
            $res->assertRedirect();
        }
        $this->assertSame(3, Pengajuan::where('buyer_id', $this->customer->id)->count());
        $this->assertSame('Diajukan', Pengajuan::latest('id')->first()->status);
    }

    public function test_pengajuan_validation(): void
    {
        $this->actingAs($this->customer);
        $this->post(route('customer.pengajuan.store'), ['tipe' => 'ngawur'])
            ->assertSessionHasErrors(['tipe']);
        $this->post(route('customer.pengajuan.store'), ['tipe' => 'jasa', 'tanggal' => '2000-01-01'])
            ->assertSessionHasErrors(['tanggal']);
        $this->post(route('customer.pengajuan.store'), ['tipe' => 'ruangan', 'jam_mulai' => '10:00', 'jam_selesai' => '09:00'])
            ->assertSessionHasErrors(['jam_selesai']);
    }

    public function test_ubah_batal_guards_and_idor(): void
    {
        $this->actingAs($this->customer);
        $p = $this->pengajuan($this->customer, 'Diproses');
        $this->patch(route('customer.pengajuan.update', $p), ['keperluan' => 'x'])->assertForbidden();
        $this->patch(route('customer.pengajuan.cancel', $p), [])->assertForbidden();

        $mine = $this->pengajuan($this->customer, 'Diajukan');
        $this->patch(route('customer.pengajuan.update', $mine), ['keperluan' => 'revisi'])->assertRedirect();
        $this->patch(route('customer.pengajuan.cancel', $mine), [])->assertRedirect();
        $this->assertSame('Dibatalkan', $mine->fresh()->status);

        // other customer cannot touch it
        $other = $this->pengajuan($this->customer, 'Diajukan');
        $this->actingAs($this->customer2);
        $this->get(route('customer.pengajuan.show', $other))->assertForbidden();
        $this->patch(route('customer.pengajuan.update', $other), ['keperluan' => 'hack'])->assertForbidden();
        $this->patch(route('customer.pengajuan.cancel', $other), [])->assertForbidden();
    }

    // ---------- S4: verifikasi pengajuan ----------

    public function test_rtpu_approve_and_reject_with_note(): void
    {
        $p = $this->pengajuan($this->customer, 'Diajukan');
        $this->actingAs($this->rtpu);
        $this->patch(route('rtpu.verify.layanan.approve', $p))->assertRedirect();
        $p->refresh();
        $this->assertSame('Menunggu Pembayaran', $p->status);
        $this->assertNotNull($p->order);
        $this->assertSame('menunggu_pembayaran', $p->order->status);

        $q = $this->pengajuan($this->customer, 'Diajukan');
        $this->patch(route('rtpu.verify.layanan.reject', $q), [])->assertSessionHasErrors(['catatan']);
        $this->assertSame('Diajukan', $q->fresh()->status);
        $this->patch(route('rtpu.verify.layanan.reject', $q), ['catatan' => 'Data kurang.'])->assertRedirect();
        $this->assertSame('Ditolak', $q->fresh()->status);

        // customer sees the note and can resubmit
        $this->actingAs($this->customer);
        $show = $this->get(route('customer.pengajuan.show', $q))->assertOk();
        $show->assertInertia(fn ($page) => $page->where('item.note', 'Data kurang.'));
        $this->patch(route('customer.pengajuan.update', $q), ['keperluan' => 'lengkap sekarang'])->assertRedirect();
        $this->assertSame('Diajukan', $q->fresh()->status);
    }

    public function test_non_rtpu_cannot_verify(): void
    {
        $p = $this->pengajuan($this->customer, 'Diajukan');
        foreach ([$this->customer, $this->p3m, $this->pimpinan, $this->direktur] as $u) {
            $this->actingAs($u);
            $this->patch(route('rtpu.verify.layanan.approve', $p))->assertForbidden();
            $this->patch(route('rtpu.verify.layanan.reject', $p), ['catatan' => 'x'])->assertForbidden();
        }
        // super_admin has its own lane, not RTPU's
        $this->actingAs($this->superadmin);
        $this->patch(route('rtpu.verify.layanan.approve', $p))->assertForbidden();
    }

    // ---------- S5/S6: order & pembayaran ----------

    public function test_checkout_total_equals_stored_order(): void
    {
        $this->actingAs($this->customer);
        $prod = $this->product('produk');
        $prod->update(['final_price' => 200000]);
        $this->post(route('customer.pengajuan.store'), [
            'tipe' => 'produk', 'product_id' => $prod->id, 'jumlah' => '3',
        ]);
        $p = Pengajuan::latest('id')->first();

        $this->actingAs($this->rtpu);
        $this->patch(route('rtpu.verify.layanan.approve', $p))->assertRedirect();

        $this->actingAs($this->customer);
        $page = $this->get(route('customer.pengajuan.bayar', $p))->assertOk();
        $page->assertInertia(fn ($pg) => $pg
            ->where('tagihan.subtotal', 600000)
            ->where('tagihan.total', 600000)
            ->has('metode', 1)
            ->where('metode.0.name', 'Mandiri BLU PNJ')
        );
        $p->refresh();
        $this->assertSame($p->order->total, 600000);
        printf("checkout=bayar=order total: %d\n", $p->order->total);
    }

    public function test_proof_upload_rules(): void
    {
        Storage::fake('public');
        $this->actingAs($this->customer);
        $p = $this->pengajuan($this->customer, 'Menunggu Pembayaran');

        // invalid mime rejected
        $this->post(route('customer.pengajuan.proof', $p), [
            'metode_id' => 1,
            'bukti' => UploadedFile::fake()->create('x.exe', 100, 'application/x-msdownload'),
        ])->assertSessionHasErrors(['bukti']);

        // cannot upload before verification state
        $early = $this->pengajuan($this->customer, 'Diajukan');
        $this->post(route('customer.pengajuan.proof', $early), [
            'metode_id' => 1,
            'bukti' => UploadedFile::fake()->create('b.jpg', 100, 'image/jpeg'),
        ])->assertForbidden();

        // other's pengajuan forbidden
        $this->actingAs($this->customer2);
        $this->post(route('customer.pengajuan.proof', $p), [
            'metode_id' => 1,
            'bukti' => UploadedFile::fake()->create('b.jpg', 100, 'image/jpeg'),
        ])->assertForbidden();

        // valid upload advances
        $this->actingAs($this->customer);
        $this->post(route('customer.pengajuan.proof', $p), [
            'metode_id' => 1,
            'bukti' => UploadedFile::fake()->create('bukti.jpg', 100, 'image/jpeg'),
        ])->assertRedirect();
        $this->assertSame('Menunggu Verifikasi Pembayaran', $p->fresh()->status);
    }

    public function test_verify_payment_guards(): void
    {
        Storage::fake('public');
        $this->actingAs($this->customer);
        $p = $this->pengajuan($this->customer, 'Menunggu Pembayaran');
        $this->post(route('customer.pengajuan.proof', $p), [
            'metode_id' => 1,
            'bukti' => UploadedFile::fake()->create('b.jpg', 100, 'image/jpeg'),
        ]);
        $proof = $p->fresh()->order->paymentProofs()->firstOrFail();

        $this->actingAs($this->rtpu);
        $this->patch(route('rtpu.verify.bayar.reject', $proof->id), [])->assertSessionHasErrors(['catatan']);
        $this->patch(route('rtpu.verify.bayar.reject', $proof->id), ['catatan' => 'Buram.'])->assertRedirect();
        $p->refresh();
        $this->assertSame('Menunggu Pembayaran', $p->status); // returned to payment step

        // re-upload after rejection works
        $this->actingAs($this->customer);
        $this->post(route('customer.pengajuan.proof', $p), [
            'metode_id' => 1,
            'bukti' => UploadedFile::fake()->create('b2.jpg', 100, 'image/jpeg'),
        ])->assertRedirect();

        $this->actingAs($this->rtpu);
        $proof2 = $p->fresh()->order->paymentProofs()->latest('id')->first();
        $this->patch(route('rtpu.verify.bayar.accept', $proof2->id))->assertRedirect();
        $this->assertSame('Diproses', $p->fresh()->status);
        // already-verified cannot be verified again
        $this->patch(route('rtpu.verify.bayar.accept', $proof2->id))->assertForbidden();
        $this->patch(route('rtpu.verify.bayar.reject', $proof2->id), ['catatan' => 'x'])->assertForbidden();
    }

    // ---------- S7/S8: status & cancel ----------

    public function test_status_transitions_and_history(): void
    {
        $this->actingAs($this->customer);
        $this->post(route('customer.pengajuan.store'), ['tipe' => 'jasa', 'keperluan' => 'Uji', 'jumlah' => '1']);
        $p = Pengajuan::latest('id')->first();

        $this->actingAs($this->rtpu);
        $this->patch(route('rtpu.verify.layanan.approve', $p))->assertRedirect();
        // simulate payment verified path to Diproses
        $p->refresh();
        $p->setStatus('Diproses', null, 'Admin RTPU');
        $p->save();

        $this->patch(route('rtpu.status.update', $p), ['status' => 'Selesai', 'catatan' => 'Serah terima.'])->assertRedirect();
        $p->refresh();
        $history = $p->history;
        $last = $history[count($history) - 1];
        $this->assertSame('Diproses', $last['from']);
        $this->assertSame('Selesai', $last['status']);
        $this->assertSame('Serah terima.', $last['note']);
        $this->assertNotEmpty($last['at']);
        $this->assertNotEmpty($last['by']);
        $this->assertSame('selesai', $p->order->status);
        $this->assertNotNull($p->order->completed_at);

        // edits after close blocked
        $this->actingAs($this->customer);
        $this->patch(route('customer.pengajuan.update', $p), ['keperluan' => 'x'])->assertForbidden();
        $this->patch(route('customer.pengajuan.cancel', $p), [])->assertForbidden();
    }

    public function test_cancel_leaves_history_and_riwayat(): void
    {
        $this->actingAs($this->customer);
        $p = $this->pengajuan($this->customer, 'Diajukan');
        $this->patch(route('customer.pengajuan.cancel', $p), ['alasan' => 'Jadwal berubah.'])->assertRedirect();
        $p->refresh();
        $this->assertSame('Dibatalkan', $p->status);
        $history = $p->history;
        $last = $history[count($history) - 1];
        $this->assertSame('Diajukan', $last['from']);
        $this->assertSame('Dibatalkan', $last['status']);

        $riwayat = $this->get(route('customer.riwayat'))->assertOk();
        $riwayat->assertInertia(fn ($pg) => $pg->has('riwayat'));
        $pemantauan = $this->get(route('customer.pengajuan.index'))->assertOk();
        $pemantauan->assertInertia(fn ($pg) => $pg->where('pengajuan', []));
    }
}

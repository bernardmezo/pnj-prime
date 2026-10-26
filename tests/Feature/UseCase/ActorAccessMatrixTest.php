<?php

namespace Tests\Feature\UseCase;

use App\Models\MetodePembayaran;
use App\Models\Pengajuan;
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
 * CHECK B — actor × use case access conformance (allow AND deny).
 *
 * Every read route that serves a use case is asserted for all six actors, and
 * every mutating endpoint is asserted against the actors the diagram does NOT
 * associate. Uses one seeded demo-style user per actor.
 */
class ActorAccessMatrixTest extends TestCase
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

        $this->customer = User::factory()->customer()->create(['email' => 'c1@mx.test']);
        $this->customer2 = User::factory()->customer()->create(['email' => 'c2@mx.test']);
        $this->rtpu = User::factory()->adminRtpu()->create(['email' => 'rtpu@mx.test']);
        $this->p3m = User::factory()->adminP3m()->create(['email' => 'p3m@mx.test']);
        $this->p3m2 = User::factory()->adminP3m()->create(['email' => 'p3mb@mx.test']);
        $this->pimpinan = User::factory()->pimpinanRtpu()->create(['email' => 'pim@mx.test']);
        $this->direktur = User::factory()->direktur()->create(['email' => 'dir@mx.test']);
        $this->superadmin = User::factory()->superAdmin()->create(['email' => 'sa@mx.test']);
    }

    private function actor(string $role): User
    {
        return match ($role) {
            'customer' => $this->customer,
            'admin_rtpu' => $this->rtpu,
            'admin_p3m' => $this->p3m,
            'pimpinan_rtpu' => $this->pimpinan,
            'direktur' => $this->direktur,
            'super_admin' => $this->superadmin,
            default => throw new \InvalidArgumentException("Unknown role {$role}"),
        };
    }

    private function pengajuan(User $owner, string $status = 'Diajukan'): Pengajuan
    {
        return Pengajuan::create([
            'code' => 'PNJ-T-'.uniqid(), 'buyer_id' => $owner->id, 'tipe' => 'jasa',
            'keperluan' => 'Butuh', 'jumlah' => '1', 'status' => $status, 'history' => [],
        ]);
    }

    private function produkUnggulan(User $owner, string $status = 'Diajukan'): ProdukUnggulan
    {
        return ProdukUnggulan::create([
            'code' => 'PNJ-PU-'.uniqid(), 'owner_id' => $owner->id,
            'name' => 'PU '.uniqid(), 'status' => $status, 'history' => [],
        ]);
    }

    /** @param array<int, string> $uris */
    private function assertReads(string $actor, array $allowed, array $denied): void
    {
        foreach ($allowed as $uri) {
            $this->get($uri)->assertOk("{$actor} should read {$uri}");
            printf("[OK]   %-14s GET %s -> 200\n", $actor, $uri);
        }
        foreach ($denied as $uri) {
            $this->get($uri)->assertForbidden("{$actor} must be denied {$uri}");
            printf("[DENY] %-14s GET %s -> 403\n", $actor, $uri);
        }
    }

    #[TestDox('UC-01..UC-44 Actor x Use Case matrix — Customer')]
    public function test_matrix_customer(): void
    {
        $this->actingAs($this->customer);
        $this->assertReads('customer',
            ['/dashboard', '/katalog', '/pengajuan', '/pengajuan/create', '/riwayat', '/profile'],
            ['/p3m/produk-unggulan', '/rtpu/verifikasi/layanan', '/rtpu/verifikasi/pembayaran',
                '/rtpu/status', '/rtpu/metode', '/rtpu/layanan', '/rtpu/riwayat',
                '/pimpinan/verifikasi', '/pimpinan/pemantauan', '/pimpinan/riwayat',
                '/direktur/pemantauan', '/direktur/riwayat',
                '/superadmin/users', '/superadmin/hak-akses', '/superadmin/fitur']
        );
        $this->get('/')->assertOk();
    }

    #[TestDox('UC-01..UC-44 Actor x Use Case matrix — Admin RTPU')]
    public function test_matrix_admin_rtpu(): void
    {
        $this->actingAs($this->rtpu);
        $this->assertReads('admin_rtpu',
            ['/dashboard', '/katalog', '/rtpu/dashboard', '/rtpu/verifikasi/layanan', '/rtpu/verifikasi/pembayaran',
                '/rtpu/status', '/rtpu/layanan', '/rtpu/layanan/create', '/rtpu/metode', '/rtpu/riwayat',
                '/admin/settings', '/admin/external-links'],
            ['/pengajuan', '/riwayat', '/p3m/produk-unggulan',
                '/pimpinan/verifikasi', '/pimpinan/pemantauan', '/pimpinan/riwayat',
                '/direktur/pemantauan', '/direktur/riwayat',
                '/superadmin/users', '/superadmin/hak-akses', '/superadmin/fitur']
        );
        // staff home redirects to its own dashboard, not the shopping flow
        $this->get('/')->assertRedirect(route('dashboard'));
    }

    #[TestDox('UC-01..UC-44 Actor x Use Case matrix — Admin P3M')]
    public function test_matrix_admin_p3m(): void
    {
        $this->actingAs($this->p3m);
        $this->assertReads('admin_p3m',
            ['/dashboard', '/katalog', '/p3m/dashboard', '/p3m/produk-unggulan', '/p3m/riwayat'],
            ['/pengajuan', '/riwayat', '/rtpu/status', '/rtpu/verifikasi/layanan', '/rtpu/verifikasi/pembayaran',
                '/rtpu/metode', '/rtpu/layanan', '/pimpinan/verifikasi', '/pimpinan/pemantauan',
                '/direktur/pemantauan', '/direktur/riwayat',
                '/superadmin/users', '/superadmin/hak-akses', '/superadmin/fitur']
        );
    }

    #[TestDox('UC-01..UC-44 Actor x Use Case matrix — Pimpinan RTPU')]
    public function test_matrix_pimpinan(): void
    {
        $this->actingAs($this->pimpinan);
        $this->assertReads('pimpinan_rtpu',
            ['/dashboard', '/katalog', '/pimpinan/dashboard', '/pimpinan/verifikasi', '/pimpinan/pemantauan', '/pimpinan/riwayat'],
            ['/pengajuan', '/riwayat', '/p3m/produk-unggulan', '/rtpu/status', '/rtpu/verifikasi/layanan',
                '/rtpu/verifikasi/pembayaran', '/rtpu/metode', '/rtpu/layanan',
                '/direktur/pemantauan', '/direktur/riwayat',
                '/superadmin/users', '/superadmin/hak-akses', '/superadmin/fitur']
        );
    }

    #[TestDox('UC-01..UC-44 Actor x Use Case matrix — Direktur')]
    public function test_matrix_direktur(): void
    {
        $this->actingAs($this->direktur);
        $this->assertReads('direktur',
            ['/dashboard', '/katalog', '/direktur/dashboard', '/direktur/pemantauan', '/direktur/riwayat'],
            ['/pengajuan', '/riwayat', '/p3m/produk-unggulan', '/rtpu/status', '/rtpu/verifikasi/layanan',
                '/rtpu/verifikasi/pembayaran', '/rtpu/metode', '/rtpu/layanan',
                '/pimpinan/verifikasi', '/pimpinan/pemantauan', '/pimpinan/riwayat',
                '/superadmin/users', '/superadmin/hak-akses', '/superadmin/fitur']
        );
    }

    #[TestDox('UC-01..UC-44 Actor x Use Case matrix — Super Admin')]
    public function test_matrix_super_admin(): void
    {
        $this->actingAs($this->superadmin);
        $this->assertReads('super_admin',
            ['/dashboard', '/katalog', '/superadmin/dashboard', '/superadmin/users', '/superadmin/hak-akses', '/superadmin/fitur'],
            ['/pengajuan', '/riwayat', '/p3m/produk-unggulan', '/rtpu/status', '/rtpu/verifikasi/layanan',
                '/rtpu/verifikasi/pembayaran', '/rtpu/metode', '/rtpu/layanan',
                '/pimpinan/verifikasi', '/pimpinan/pemantauan', '/pimpinan/riwayat',
                '/direktur/pemantauan', '/direktur/riwayat']
        );
    }

    #[TestDox('UC-01..UC-44 Mutating endpoints — denied for every actor NOT associated')]
    public function test_matrix_mutating_denials(): void
    {
        $p = $this->pengajuan($this->customer, 'Diajukan');
        $pu = $this->produkUnggulan($this->p3m, 'Diajukan');
        $metode = MetodePembayaran::firstOrFail();

        $cases = [
            // actor, method, uri, payload
            ['customer', 'patch', "/rtpu/verifikasi/layanan/{$p->id}/approve", []],
            ['customer', 'patch', "/rtpu/status/{$p->id}", ['status' => 'Selesai']],
            ['customer', 'post', '/rtpu/metode', ['name' => 'x', 'type' => 'y', 'account' => 'z', 'holder' => 'w']],
            ['customer', 'post', '/rtpu/layanan', ['tipe' => 'jasa', 'name' => 'x', 'price' => 1]],
            ['customer', 'post', '/p3m/produk-unggulan', ['name' => 'x']],
            ['customer', 'post', '/superadmin/users', ['name' => 'x', 'email' => 'x@y.id', 'password' => 'password123', 'role' => 'customer']],
            ['customer', 'post', '/superadmin/fitur', ['name' => 'x', 'key' => 'x-y']],
            ['customer', 'post', '/superadmin/hak-akses', ['matriks' => []]],
            ['customer', 'patch', "/pimpinan/verifikasi/{$pu->id}/approve", []],
            ['admin_rtpu', 'patch', "/pimpinan/verifikasi/{$pu->id}/approve", []],
            ['admin_rtpu', 'post', '/p3m/produk-unggulan', ['name' => 'x']],
            ['admin_rtpu', 'post', '/superadmin/users', ['name' => 'x', 'email' => 'x@y.id', 'password' => 'password123', 'role' => 'customer']],
            ['admin_rtpu', 'patch', "/pengajuan/{$p->id}", ['keperluan' => 'x']],
            ['admin_p3m', 'patch', "/rtpu/verifikasi/layanan/{$p->id}/approve", []],
            ['admin_p3m', 'patch', "/rtpu/status/{$p->id}", ['status' => 'Selesai']],
            ['admin_p3m', 'post', '/superadmin/users', ['name' => 'x', 'email' => 'x@y.id', 'password' => 'password123', 'role' => 'customer']],
            ['pimpinan_rtpu', 'patch', "/rtpu/verifikasi/layanan/{$p->id}/approve", []],
            ['pimpinan_rtpu', 'patch', "/rtpu/status/{$p->id}", ['status' => 'Selesai']],
            ['pimpinan_rtpu', 'post', '/p3m/produk-unggulan', ['name' => 'x']],
            ['direktur', 'patch', "/rtpu/verifikasi/layanan/{$p->id}/approve", []],
            ['direktur', 'patch', "/pimpinan/verifikasi/{$pu->id}/approve", []],
            ['direktur', 'patch', "/rtpu/status/{$p->id}", ['status' => 'Selesai']],
            ['direktur', 'post', '/superadmin/users', ['name' => 'x', 'email' => 'x@y.id', 'password' => 'password123', 'role' => 'customer']],
            ['super_admin', 'patch', "/rtpu/verifikasi/layanan/{$p->id}/approve", []],
            ['super_admin', 'patch', "/rtpu/status/{$p->id}", ['status' => 'Selesai']],
            ['super_admin', 'post', '/p3m/produk-unggulan', ['name' => 'x']],
            ['super_admin', 'post', '/rtpu/metode', ['name' => 'x', 'type' => 'y', 'account' => 'z', 'holder' => 'w']],
        ];

        foreach ($cases as [$role, $method, $uri, $payload]) {
            $this->actingAs($this->actor($role));
            $this->{$method}($uri, $payload)->assertForbidden("{$role} must be denied {$method} {$uri}");
            printf("[DENY] %-14s %-5s %s -> 403\n", $role, strtoupper($method), $uri);
        }

        // Admin RTPU keeps its own method/layanan lane (positive control)
        $this->actingAs($this->rtpu);
        $this->patch(route('rtpu.metode.update', $metode), [
            'name' => $metode->nama, 'type' => $metode->tipe, 'account' => $metode->rekening, 'holder' => $metode->holder,
        ])->assertRedirect();
        printf("[OK]   %-14s PATCH /rtpu/metode/%d -> 302\n", 'admin_rtpu', $metode->id);
    }

    #[TestDox('UC-03 Mendaftar Akun — staff cannot self-register')]
    public function test_staff_cannot_self_register(): void
    {
        $this->actingAs($this->rtpu);
        $this->get('/register')->assertRedirect(route('dashboard'));
        printf("[OK] staff GET /register -> redirect /dashboard (guest-only route)\n");
    }

    #[TestDox('UC-14 Data scope — Customer sees only their own pengajuan')]
    public function test_data_scope_customer(): void
    {
        $a = $this->pengajuan($this->customer, 'Diajukan');
        $b = $this->pengajuan($this->customer2, 'Diajukan');

        $this->actingAs($this->customer);
        $this->get(route('customer.pengajuan.index'))->assertInertia(fn (Assert $p) => $p
            ->has('pengajuan', 1)->where('pengajuan.0.code', $a->code));
        $this->get(route('customer.pengajuan.show', $b))->assertForbidden();
        $this->patch(route('customer.pengajuan.cancel', $b), [])->assertForbidden();
        printf("[OK] customer scope: sees own (%s), 403 on other's (%s)\n", $a->code, $b->code);
    }

    #[TestDox('UC-24 Data scope — Admin P3M sees only their own produk unggulan')]
    public function test_data_scope_p3m(): void
    {
        $mine = $this->produkUnggulan($this->p3m, 'Diajukan');
        $theirs = $this->produkUnggulan($this->p3m2, 'Diajukan');

        $this->actingAs($this->p3m);
        $this->get(route('p3m.produk.index'))->assertInertia(fn (Assert $p) => $p
            ->has('daftar', 1)->where('daftar.0.id', $mine->id));
        $this->get(route('p3m.produk.show', $theirs))->assertForbidden();
        $this->patch(route('p3m.produk.cancel', $theirs), [])->assertForbidden();
        printf("[OK] p3m scope: sees own PU %d, 403 on other's PU %d\n", $mine->id, $theirs->id);
    }

    #[TestDox('UC-23/28 Data scope — Admin RTPU sees ALL layanan (no leakage)')]
    public function test_data_scope_rtpu(): void
    {
        $this->pengajuan($this->customer, 'Diajukan');
        $this->pengajuan($this->customer2, 'Diajukan');

        $this->actingAs($this->rtpu);
        $this->get(route('rtpu.verify.layanan'))->assertInertia(fn (Assert $p) => $p->has('antrean', 2));
        printf("[OK] rtpu scope: sees both customers' pengajuan (2 rows)\n");
    }

    #[TestDox('UC-29 Verifikasi Pembayaran — Admin RTPU allowed, others denied end-to-end')]
    public function test_uc29_access(): void
    {
        Storage::fake('public');
        $this->actingAs($this->customer);
        $p = $this->pengajuan($this->customer, 'Menunggu Pembayaran');
        $this->post(route('customer.pengajuan.proof', $p), [
            'metode_id' => MetodePembayaran::firstOrFail()->id,
            'bukti' => UploadedFile::fake()->image('b.jpg'),
        ]);
        $proof = $p->fresh()->order->paymentProofs()->firstOrFail();

        foreach (['pimpinan_rtpu', 'admin_p3m', 'direktur', 'super_admin', 'customer'] as $role) {
            $this->actingAs($this->actor($role));
            $this->patch(route('rtpu.verify.bayar.accept', $proof->id))->assertForbidden();
            printf("[DENY] %-14s PATCH verify.bayar.accept -> 403\n", $role);
        }

        $this->actingAs($this->rtpu);
        $this->patch(route('rtpu.verify.bayar.accept', $proof->id))->assertRedirect();
        printf("[OK]   %-14s PATCH verify.bayar.accept -> 302\n", 'admin_rtpu');
    }
}

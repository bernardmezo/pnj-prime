<?php

namespace Tests\Feature\SuperAdmin;

use App\Models\Fitur;
use App\Models\Permission;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Server rules for the Super Admin "Hak Akses" redesign.
 *
 * Context: fitur x aksi are grouped under six roles. Aksi is one of
 * Lihat, Tambah, Ubah, Hapus, Verifikasi. Each fitur exposes a subset
 * (`aksi_tersedia`). Super Admin is locked to full access and three fitur
 * (pengguna, hak-akses, fitur) are protected.
 */
class HakAksesRulesTest extends TestCase
{
    use RefreshDatabase;

    private User $superAdmin;

    private User $customer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(UsecaseSeeder::class);
        $this->superAdmin = User::factory()->create(['email' => 'sa@test.id', 'role' => 'super_admin']);
        $this->customer = User::factory()->create(['email' => 'c@test.id', 'role' => 'customer']);
    }

    private function allowed(string $role, string $fitur, string $aksi): bool
    {
        return (bool) Permission::query()
            ->where('role', $role)
            ->where('fitur_key', $fitur)
            ->where('aksi', $aksi)
            ->value('allowed');
    }

    public function test_dependent_action_auto_enables_likat(): void
    {
        $this->actingAs($this->superAdmin);

        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['customer' => ['katalog' => ['Lihat' => false, 'Tambah' => true]]],
        ])->assertRedirect();

        // Policy chosen: auto-set Lihat = true when a dependent action is on.
        $this->assertTrue($this->allowed('customer', 'katalog', 'Lihat'));
        $this->assertTrue($this->allowed('customer', 'katalog', 'Tambah'));
    }

    public function test_likat_can_be_disabled_when_no_dependent_actions(): void
    {
        $this->actingAs($this->superAdmin);

        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['customer' => ['katalog' => ['Lihat' => false]]],
        ])->assertRedirect();

        $this->assertFalse($this->allowed('customer', 'katalog', 'Lihat'));
    }

    public function test_action_outside_aksi_tersedia_is_rejected(): void
    {
        Fitur::where('key', 'katalog')->firstOrFail()->update(['aksi_tersedia' => ['Lihat']]);

        $this->actingAs($this->superAdmin);

        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['customer' => ['katalog' => ['Tambah' => true]]],
        ])->assertStatus(422);

        $this->assertFalse($this->allowed('customer', 'katalog', 'Tambah'));
    }

    public function test_super_admin_is_locked_to_full_access(): void
    {
        Fitur::where('key', 'katalog')->firstOrFail()->update(['aksi_tersedia' => ['Lihat', 'Tambah']]);

        $this->actingAs($this->superAdmin);

        // Client tries to strip Super Admin access — it must be ignored.
        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['super_admin' => ['katalog' => ['Lihat' => false, 'Tambah' => false]]],
        ])->assertRedirect();

        $this->assertTrue($this->allowed('super_admin', 'katalog', 'Lihat'));
        $this->assertTrue($this->allowed('super_admin', 'katalog', 'Tambah'));

        // It never persists an action the fitur does not expose.
        $this->assertSame(0, Permission::where('role', 'super_admin')->where('fitur_key', 'katalog')->where('aksi', 'Verifikasi')->where('allowed', true)->count());
    }

    public function test_protected_fitur_stay_full_for_super_admin(): void
    {
        $this->actingAs($this->superAdmin);

        $matriks = ['super_admin' => []];
        foreach (Fitur::PROTECTED as $key) {
            foreach (Permission::AKSI as $aksi) {
                $matriks['super_admin'][$key][$aksi] = false;
            }
        }

        $this->post(route('superadmin.hakakses.save'), ['matriks' => $matriks])->assertRedirect();

        foreach (Fitur::PROTECTED as $key) {
            $this->assertTrue($this->allowed('super_admin', $key, 'Lihat'));
            $this->assertTrue((bool) Fitur::where('key', $key)->firstOrFail()->aktif);
        }

        // FiturController still refuses to deactivate the protected fitur.
        $this->patch(route('superadmin.fitur.update', 'pengguna'), [
            'name' => 'Manajemen Pengguna', 'active' => false,
        ])->assertStatus(422);
    }

    public function test_save_flushes_permission_cache(): void
    {
        $user = $this->customer;
        $this->assertFalse($user->canDo('katalog', 'Ubah'));

        $this->actingAs($this->superAdmin);
        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['customer' => ['katalog' => ['Ubah' => true]]],
        ])->assertRedirect();

        // Without the flush this would still be the cached `false`.
        $this->assertTrue($user->canDo('katalog', 'Ubah'));
    }

    public function test_index_exposes_meta_role_counts_and_defaults(): void
    {
        $this->actingAs($this->superAdmin);

        $this->get(route('superadmin.hakakses'))->assertInertia(fn ($page) => $page
            ->component('SuperAdmin/HakAkses')
            ->has('fitur')
            ->has('matriks')
            ->has('roleCounts')
            ->has('bawaan')
            ->where('roleCounts.super_admin', 1)
            ->where('roleCounts.customer', 1)
            ->where('fitur.0.grup', 'Layanan')
            ->where('fitur.0.aksi_tersedia', Permission::AKSI)
            ->where('fitur.0.locked', false)
            ->has('bawaan.customer.katalog.Lihat')
        );
    }

    public function test_fitur_controller_persists_meta_fields(): void
    {
        $this->actingAs($this->superAdmin);

        $this->patch(route('superadmin.fitur.update', 'katalog'), [
            'name' => 'Katalog Layanan',
            'desc' => 'Katalog.',
            'active' => true,
            'grup' => 'Katalog',
            'urutan' => 9,
            'aksi_tersedia' => ['Lihat', 'Tambah'],
        ])->assertRedirect();

        $fitur = Fitur::where('key', 'katalog')->firstOrFail();
        $this->assertSame('Katalog', $fitur->grup);
        $this->assertSame(9, $fitur->urutan);
        $this->assertSame(['Lihat', 'Tambah'], $fitur->aksi_tersedia);

        // An action outside aksi_tersedia is rejected on save.
        $this->post(route('superadmin.hakakses.save'), [
            'matriks' => ['customer' => ['katalog' => ['Verifikasi' => true]]],
        ])->assertStatus(422);
    }
}

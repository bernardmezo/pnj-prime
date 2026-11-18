<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        $this->seed(\Database\Seeders\UsecaseSeeder::class);
        User::flushPermissionCache();
    }

    private function payload(array $override = []): array
    {
        return array_merge([
            'name' => 'Nama Baru',
            'email' => 'baru@example.com',
            'phone' => '081234567890',
            'institution' => 'PT Contoh',
        ], $override);
    }

    public function test_profile_page_is_displayed_for_every_role(): void
    {
        foreach (['customer', 'admin_pengelola', 'admin_rtpu', 'pimpinan_rtpu', 'direktur', 'super_admin'] as $role) {
            $user = User::factory()->create(['role' => $role]);
            $this->actingAs($user)->get('/profile')->assertOk();
        }
    }

    public function test_guest_cannot_open_profile(): void
    {
        $this->get('/profile')->assertRedirect(route('login'));
    }

    public function test_umum_customer_updates_core_fields_and_postal_code(): void
    {
        $user = User::factory()->customer()->create(['user_type' => 'Masyarakat umum', 'institution' => null]);

        $this->actingAs($user)->patch('/profile', $this->payload([
            'address' => 'Jl. Prof. DR. G.A. Siwabessy, Kukusan, Depok',
            'postal_code' => '16424',
            'institution' => 'Tidak boleh tersimpan',
        ]))->assertSessionHasNoErrors()->assertRedirect('/profile');

        $user->refresh();
        $this->assertSame('Nama Baru', $user->name);
        $this->assertSame('16424', $user->postal_code);
        $this->assertNull($user->institution);
        $this->assertNull($user->email_verified_at);
    }

    public function test_umum_customer_still_requires_email_and_phone(): void
    {
        $user = User::factory()->customer()->create(['user_type' => 'Masyarakat umum']);

        $this->actingAs($user)->patch('/profile', $this->payload(['email' => '', 'phone' => '']))
            ->assertSessionHasErrors(['email', 'phone']);
    }

    public function test_company_customer_requires_company_and_pic_and_saves_meta(): void
    {
        $user = User::factory()->customer()->create([
            'user_type' => 'Industri/Perusahaan',
            'meta' => ['bidang_usaha' => 'Manufaktur', 'catatan_lain' => 'jangan hilang'],
        ]);

        $this->actingAs($user)->patch('/profile', $this->payload(['email' => $user->email, 'institution' => '', 'penanggung_jawab' => '']))
            ->assertSessionHasErrors(['institution', 'penanggung_jawab']);

        $this->actingAs($user)->patch('/profile', $this->payload([
            'email' => $user->email,
            'institution' => 'PT Maju Jaya',
            'penanggung_jawab' => 'Budi',
            'npwp_perusahaan' => '01.234.567.8-901.000',
            'bidang_usaha' => 'Teknik',
            // kunci jenis lain tidak boleh masuk
            'nomor_mou_pks' => 'MOU-1',
        ]))->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('PT Maju Jaya', $user->institution);
        $this->assertSame('Budi', $user->meta['penanggung_jawab']);
        $this->assertSame('01.234.567.8-901.000', $user->meta['npwp_perusahaan']);
        $this->assertSame('Teknik', $user->meta['bidang_usaha']);
        $this->assertSame('jangan hilang', $user->meta['catatan_lain']);
        $this->assertArrayNotHasKey('nomor_mou_pks', $user->meta);
    }

    public function test_company_npwp_is_optional(): void
    {
        $user = User::factory()->customer()->create(['user_type' => 'Industri/Perusahaan']);

        $this->actingAs($user)->patch('/profile', $this->payload([
            'email' => $user->email, 'institution' => 'PT Maju', 'penanggung_jawab' => 'Budi',
        ]))->assertSessionHasNoErrors();
    }

    public function test_partner_customer_requires_institution_and_contact_person(): void
    {
        $user = User::factory()->customer()->create(['user_type' => 'Mitra kerja sama']);

        $this->actingAs($user)->patch('/profile', $this->payload(['email' => $user->email, 'institution' => '', 'contact_person' => '']))
            ->assertSessionHasErrors(['institution', 'contact_person']);

        $this->actingAs($user)->patch('/profile', $this->payload([
            'email' => $user->email, 'institution' => 'Dinas X', 'contact_person' => 'Sari',
            'nomor_mou_pks' => 'PKS-77', 'periode_kerja_sama' => '2026-2027',
        ]))->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('PKS-77', $user->meta['nomor_mou_pks']);
        $this->assertSame('Sari', $user->meta['contact_person']);
    }

    public function test_college_customer_requires_institution(): void
    {
        $user = User::factory()->customer()->create(['user_type' => 'Perguruan tinggi/lembaga lain']);

        $this->actingAs($user)->patch('/profile', $this->payload(['email' => $user->email, 'institution' => '']))
            ->assertSessionHasErrors('institution');
    }

    public function test_sso_email_is_locked_and_verification_is_kept(): void
    {
        $user = User::factory()->customer()->create([
            'user_type' => 'civitas', 'account_origin' => 'sso_pnj', 'email' => 'dosen@pnj.ac.id',
        ]);

        $this->actingAs($user)->patch('/profile', $this->payload(['email' => 'lain@example.com']))
            ->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('dosen@pnj.ac.id', $user->email);
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame('Nama Baru', $user->name);
    }

    public function test_user_type_cannot_be_changed_from_profile(): void
    {
        $user = User::factory()->customer()->create(['user_type' => 'Masyarakat umum']);

        $this->actingAs($user)->patch('/profile', $this->payload(['email' => $user->email, 'user_type' => 'Industri/Perusahaan']))
            ->assertSessionHasNoErrors();

        $this->assertSame('Masyarakat umum', $user->fresh()->user_type);
    }

    public function test_phone_and_email_are_required(): void
    {
        $user = User::factory()->customer()->create();

        $this->actingAs($user)->patch('/profile', $this->payload(['phone' => '', 'email' => '']))
            ->assertSessionHasErrors(['phone', 'email']);
    }

    public function test_phone_must_be_indonesian_format(): void
    {
        $user = User::factory()->customer()->create();

        foreach (['12345', '0212345678', 'abc', '+1555123456'] as $bad) {
            $this->actingAs($user)->patch('/profile', $this->payload(['phone' => $bad]))->assertSessionHasErrors('phone');
        }
        foreach (['081234567890', '+6281234567890', '6281234567890', '0812-3456-7890'] as $ok) {
            $this->actingAs($user)->patch('/profile', $this->payload(['phone' => $ok, 'email' => $user->email]))->assertSessionHasNoErrors();
        }
    }

    public function test_postal_code_must_be_five_digits(): void
    {
        $user = User::factory()->customer()->create();

        foreach (['1642', '164244', 'abcde'] as $bad) {
            $this->actingAs($user)->patch('/profile', $this->payload(['postal_code' => $bad]))->assertSessionHasErrors('postal_code');
        }
    }

    public function test_email_must_be_unique_but_own_email_is_allowed(): void
    {
        $other = User::factory()->customer()->create(['email' => 'dipakai@example.com']);
        $user = User::factory()->customer()->create();

        $this->actingAs($user)->patch('/profile', $this->payload(['email' => 'dipakai@example.com']))
            ->assertSessionHasErrors('email');

        $this->actingAs($user)->patch('/profile', $this->payload(['email' => $user->email]))
            ->assertSessionHasNoErrors();
    }

    public function test_email_verification_status_is_unchanged_when_email_is_unchanged(): void
    {
        $user = User::factory()->customer()->create();

        $this->actingAs($user)->patch('/profile', $this->payload(['email' => $user->email]))
            ->assertSessionHasNoErrors();

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_role_and_status_cannot_be_changed_from_profile_form(): void
    {
        $user = User::factory()->customer()->create();

        $this->actingAs($user)->patch('/profile', $this->payload([
            'email' => $user->email,
            'role' => 'super_admin',
            'is_active' => false,
            'account_status' => 'approved',
            'nip' => '999',
            'unit_id' => 1,
            'password' => 'diubah-diam-diam',
        ]))->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertSame('customer', $user->role);
        $this->assertTrue($user->is_active);
        $this->assertNull($user->nip);
        $this->assertFalse(Hash::check('diubah-diam-diam', $user->password));
    }

    public function test_simple_roles_cannot_write_address_fields(): void
    {
        $user = User::factory()->create(['role' => 'admin_rtpu']);

        $this->actingAs($user)->patch('/profile', $this->payload([
            'email' => $user->email,
            'institution' => 'Disusupkan',
            'address' => 'Disusupkan',
            'postal_code' => '12345',
        ]))->assertSessionHasNoErrors();

        $user->refresh();
        $this->assertNull($user->address);
        $this->assertNull($user->postal_code);
        $this->assertNotSame('Disusupkan', $user->institution);
        $this->assertSame('081234567890', $user->phone);
    }

    public function test_direktur_can_edit_own_profile(): void
    {
        $user = User::factory()->direktur()->create();

        $this->actingAs($user)->patch('/profile', $this->payload(['email' => $user->email]))
            ->assertSessionHasNoErrors()->assertRedirect('/profile');
        $this->assertSame('Nama Baru', $user->refresh()->name);
    }

    public function test_user_cannot_change_another_users_profile(): void
    {
        $victim = User::factory()->customer()->create(['name' => 'Korban']);
        $user = User::factory()->customer()->create();

        // Tidak ada parameter id di route; tambahan user_id/id diabaikan.
        $this->actingAs($user)->patch('/profile', $this->payload(['email' => $user->email, 'id' => $victim->id, 'user_id' => $victim->id]))
            ->assertSessionHasNoErrors();

        $this->assertSame('Korban', $victim->fresh()->name);
        $this->assertSame('Nama Baru', $user->fresh()->name);
    }

    public function test_user_without_ubah_permission_is_rejected(): void
    {
        \App\Models\Permission::where('role', 'customer')->where('fitur_key', 'profil')->where('aksi', 'Ubah')->update(['allowed' => false]);
        User::flushPermissionCache();
        $user = User::factory()->customer()->create();

        $this->actingAs($user)->patch('/profile', $this->payload())->assertForbidden();
        $this->actingAs($user)->get('/profile')->assertOk();
    }

    public function test_delete_account_route_no_longer_exists(): void
    {
        $user = User::factory()->customer()->create();

        $this->actingAs($user)->delete('/profile', ['password' => 'password'])->assertStatus(405);
        $this->assertNotNull($user->fresh());
    }

    public function test_direktur_profile_permission_is_view_and_edit_only(): void
    {
        $rows = \App\Models\Permission::where('role', 'direktur')->where('fitur_key', 'profil')->pluck('allowed', 'aksi');
        $this->assertTrue((bool) $rows['Lihat']);
        $this->assertTrue((bool) $rows['Ubah']);
        $this->assertFalse((bool) $rows['Hapus']);
        $this->assertFalse((bool) $rows['Tambah']);
    }
}

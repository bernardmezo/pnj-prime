<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminUserVariantsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
    }

    public function test_super_admin_can_create_pengelola_variants_as_pending_without_changing_their_legacy_roles(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        foreach (['admin_p3m', 'admin_jurusan'] as $role) {
            $this->actingAs($admin)->post(route('superadmin.users.store'), [
                'name' => 'Pengelola', 'email' => "$role@example.test", 'password' => 'Password123!',
                'role' => 'admin_pengelola', 'pengelola_variant' => $role,
            ])->assertRedirect()->assertSessionHasNoErrors();
            $this->assertDatabaseHas('users', ['email' => "$role@example.test", 'role' => $role, 'account_status' => 'pending', 'is_active' => false]);
        }
    }

    public function test_edit_keeps_existing_pengelola_role_and_metadata(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $user = User::factory()->create(['role' => 'admin_jurusan', 'account_status' => 'active', 'is_active' => true, 'meta' => ['retained' => 'yes']]);
        $this->actingAs($admin)->patch(route('superadmin.users.update', $user), [
            'name' => 'Edited', 'email' => $user->email, 'role' => 'admin_pengelola',
            'pengelola_variant' => 'admin_jurusan', 'active' => true,
        ])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('admin_jurusan', $user->fresh()->role);
        $this->assertSame(['retained' => 'yes'], $user->fresh()->meta);
        $this->assertTrue($user->fresh()->is_active);
    }

    public function test_customer_cannot_be_changed_into_any_pengelola_variant(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $customer = User::factory()->create(['role' => 'customer']);
        foreach (['admin_p3m', 'admin_jurusan'] as $variant) {
            $this->actingAs($admin)->patch(route('superadmin.users.update', $customer), [
                'name' => $customer->name, 'email' => $customer->email,
                'role' => 'admin_pengelola', 'pengelola_variant' => $variant,
            ])->assertSessionHasErrors('role');
            $this->assertSame('customer', $customer->fresh()->role);
        }
    }

    public function test_registration_fields_are_created_displayed_and_preserved_on_edit(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $this->actingAs($admin)->post(route('superadmin.users.store'), [
            'name' => 'Company', 'email' => 'company@example.test', 'password' => 'Password123!',
            'role' => 'customer', 'phone' => '08123456789', 'institution' => 'Company Inc',
            'user_type' => 'Industri/Perusahaan', 'nik_npwp' => '123456',
            'npwp_perusahaan' => '987', 'penanggung_jawab' => 'Person', 'bidang_usaha' => 'Industry',
        ])->assertSessionHasNoErrors();
        $user = User::whereEmail('company@example.test')->firstOrFail();
        $this->assertSame('08123456789', $user->phone);
        $this->assertSame('987', $user->meta['npwp_perusahaan']);
        $this->get(route('superadmin.users'))->assertInertia(fn ($page) => $page
            ->component('SuperAdmin/Users/Index')
            ->where('users', fn ($users) => collect($users)->contains(fn ($u) => $u['email'] === 'company@example.test'
                && $u['phone'] === '08123456789' && $u['npwp_perusahaan'] === '987' && $u['penanggung_jawab'] === 'Person')));
        $this->patch(route('superadmin.users.update', $user), [
            'name' => 'Changed', 'email' => $user->email, 'role' => 'customer',
        ])->assertSessionHasNoErrors();
        $this->assertSame('987', $user->fresh()->meta['npwp_perusahaan']);
        $this->assertSame('08123456789', $user->fresh()->phone);
    }

    public function test_pending_pengelola_cannot_be_activated_by_super_admin_toggle(): void
    {
        $admin = User::factory()->create(['role' => 'super_admin']);
        $user = User::factory()->create(['role' => 'admin_p3m', 'account_status' => 'pending', 'is_active' => false]);
        $this->actingAs($admin)->patch(route('superadmin.users.toggle', $user))->assertStatus(422);
        $this->assertFalse($user->fresh()->is_active);
    }
}

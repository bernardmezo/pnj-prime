<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RtpuPengelolaApprovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        User::flushPermissionCache();
    }

    protected function tearDown(): void
    {
        User::flushPermissionCache();
        parent::tearDown();
    }

    public function test_customer_application_endpoints_are_disabled(): void
    {
        $customer = User::factory()->create(['role' => 'customer']);
        $this->actingAs($customer)->get('/pengelola-application')->assertStatus(410);
        $this->post('/pengelola-register', [])->assertStatus(410);
        $this->assertDatabaseCount('pengelola_applications', 0);
    }

    public function test_approval_requires_correct_role_and_verification_permission(): void
    {
        $this->seed(UsecaseSeeder::class);
        $pending = User::factory()->create(['role' => 'admin_p3m', 'account_status' => 'pending', 'is_active' => false]);
        $customer = User::factory()->create(['role' => 'customer']);
        $this->actingAs($customer)->patch('/rtpu/verifikasi-akun/'.$pending->id.'/approve')->assertForbidden();
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        \Illuminate\Support\Facades\DB::table('permissions')->where('role', 'admin_rtpu')->where('fitur_key', 'verifikasi')->where('aksi', 'Verifikasi')->update(['allowed' => false]);
        $this->actingAs($admin)->patch('/rtpu/verifikasi-akun/'.$pending->id.'/approve')->assertForbidden();
        $this->assertSame('pending', $pending->fresh()->account_status);
    }

    public function test_rtpu_can_reject_only_pending_pengelola(): void
    {
        $this->seed(UsecaseSeeder::class);
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $pending = User::factory()->create(['role' => 'admin_pengelola', 'account_status' => 'pending', 'is_active' => false]);
        $this->actingAs($admin)->patch('/rtpu/verifikasi-akun/'.$pending->id.'/reject')->assertRedirect();
        $this->assertSame('rejected', $pending->fresh()->account_status);
        $this->assertFalse($pending->fresh()->is_active);
        $this->patch('/rtpu/verifikasi-akun/'.$pending->id.'/approve')->assertStatus(422);
        $customer = User::factory()->create(['role' => 'customer', 'account_status' => 'pending', 'is_active' => false]);
        $this->patch('/rtpu/verifikasi-akun/'.$customer->id.'/approve')->assertStatus(422);
    }

    public function test_rtpu_can_view_and_approve_pending_pengelola(): void
    {
        $this->seed(UsecaseSeeder::class);
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        $pending = User::factory()->create(['role' => 'admin_jurusan', 'account_status' => 'pending', 'is_active' => false]);
        $this->actingAs($admin)->get('/rtpu/verifikasi-akun')->assertOk();
        $this->patch('/rtpu/verifikasi-akun/'.$pending->id.'/approve')->assertRedirect();
        $this->assertSame('active', $pending->fresh()->account_status);
        $this->assertTrue($pending->fresh()->is_active);
    }
}

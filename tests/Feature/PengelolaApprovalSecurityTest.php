<?php

namespace Tests\Feature;

use App\Models\PengelolaApplication;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PengelolaApprovalSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_pimpinan_can_approve_each_pending_pengelola_role(): void
    {
        $this->seed(UsecaseSeeder::class);
        $leader = User::factory()->create(['role' => 'pimpinan_rtpu']);
        foreach (['admin_pengelola', 'admin_jurusan', 'admin_p3m'] as $role) {
            $user = User::factory()->create(['role' => $role, 'account_status' => 'pending', 'is_active' => false]);
            $this->actingAs($leader)->patch(route('pimpinan.verify.akun.approve', $user))->assertRedirect();
            $this->assertSame('active', $user->fresh()->account_status);
            $this->assertTrue($user->fresh()->is_active);
            $this->assertSame($role, $user->fresh()->role);
        }
    }

    public function test_pimpinan_cannot_approve_pending_customer(): void
    {
        $this->seed(UsecaseSeeder::class);
        $leader = User::factory()->create(['role' => 'pimpinan_rtpu']);
        $customer = User::factory()->create(['role' => 'customer', 'account_status' => 'pending', 'is_active' => false]);
        $this->actingAs($leader)->patch(route('pimpinan.verify.akun.approve', $customer))->assertStatus(422);
        $this->assertSame('customer', $customer->fresh()->role);
        $this->assertSame('pending', $customer->fresh()->account_status);
    }

    public function test_customer_application_cannot_be_approved(): void
    {
        $this->seed(UsecaseSeeder::class);
        $customer = User::factory()->create(['role' => 'customer']);
        $application = PengelolaApplication::create([
            'user_id' => $customer->id, 'unit_name' => 'Unit', 'pic_name' => 'PIC',
            'phone' => '0812345678', 'status' => 'pending',
        ]);
        $admin = User::factory()->create(['role' => 'super_admin']);
        $this->actingAs($admin)->patch(route('superadmin.pengelola.approve', $application))->assertStatus(422);
        $this->assertSame('customer', $customer->fresh()->role);
        $this->assertSame('pending', $application->fresh()->status);
    }
}

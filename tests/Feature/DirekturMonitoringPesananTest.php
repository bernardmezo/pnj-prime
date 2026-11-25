<?php

namespace Tests\Feature;

use App\Models\Fitur;
use App\Models\Pengajuan;
use App\Models\Permission;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DirekturMonitoringPesananTest extends TestCase
{
    use RefreshDatabase;

    public function test_direktur_can_view_monitoring_pesanan(): void
    {
        $this->withoutVite();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();

        $buyer = User::factory()->create();
        foreach (['Diajukan', ...Pengajuan::CLOSED] as $i => $status) {
            Pengajuan::create(['code' => 'TEST-'.$i, 'buyer_id' => $buyer->id, 'tipe' => 'jasa', 'status' => $status]);
        }

        $this->actingAs(User::factory()->create(['role' => 'direktur']))
            ->get('/direktur/monitoring-pesanan')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Rtpu/StatusLayanan')->has('daftar', 1)->where('daftar.0.code', 'TEST-0'));
    }

    public function test_access_and_read_only(): void
    {
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        $this->get('/direktur/monitoring-pesanan')->assertRedirect(route('login'));
        foreach (['customer', 'admin_rtpu', 'admin_p3m', 'admin_pengelola', 'admin_jurusan', 'pimpinan_rtpu', 'super_admin'] as $role) {
            $this->actingAs(User::factory()->create(['role' => $role]))->get('/direktur/monitoring-pesanan')->assertForbidden();
        }
        $this->actingAs(User::factory()->create(['role' => 'direktur']));
        foreach (['post', 'put', 'patch', 'delete'] as $method) {
            $this->{$method}('/direktur/monitoring-pesanan')->assertStatus(405);
        }
        Permission::where('role', 'direktur')->where('fitur_key', 'pengajuan')->where('aksi', 'Lihat')->update(['allowed' => false]);
        User::flushPermissionCache();
        $this->get('/direktur/monitoring-pesanan')->assertForbidden();
        Permission::where('role', 'direktur')->where('fitur_key', 'pengajuan')->where('aksi', 'Lihat')->update(['allowed' => true]);
        User::flushPermissionCache();
        Fitur::where('key', 'pengajuan')->update(['aktif' => false]);
        $this->get('/direktur/monitoring-pesanan')->assertForbidden();
    }
}

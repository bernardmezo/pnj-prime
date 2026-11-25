<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

class CustomerRiwayatPaidTest extends TestCase
{
    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'customer_history_test');
        $app['config']->set('database.connections.customer_history_test', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
        Artisan::call('migrate', ['--database' => 'customer_history_test', '--force' => true]);

        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
    }

    public function test_paid_fulfillment_and_closed_history_are_owned_and_detail_is_accessible(): void
    {
        $buyer = User::factory()->customer()->create();
        $other = User::factory()->customer()->create();
        $rows = [];
        foreach (['produk' => ['Lunas', 'Diproses', 'Dikirim'], 'jasa' => ['Lunas', 'Diproses', 'Dijadwalkan', 'Dikerjakan', 'Hasil Diunggah'], 'ruangan' => ['Lunas', 'Berjalan'], 'sewa' => ['Lunas', 'Berjalan']] as $type => $statuses) {
            foreach ($statuses as $status) {
                $rows[] = Pengajuan::create(['code' => uniqid('HIST'), 'buyer_id' => $buyer->id, 'tipe' => $type, 'status' => $status]);
            }
        }
        foreach (['Selesai', 'Dibatalkan', 'Ditolak'] as $status) {
            $rows[] = Pengajuan::create(['code' => uniqid('HIST'), 'buyer_id' => $buyer->id, 'tipe' => 'produk', 'status' => $status]);
        }
        foreach (['Diajukan', 'Menunggu Pembayaran', 'Menunggu Verifikasi Pembayaran'] as $status) {
            Pengajuan::create(['code' => uniqid('UNPAID'), 'buyer_id' => $buyer->id, 'tipe' => 'produk', 'status' => $status]);
        }
        $foreign = Pengajuan::create(['code' => uniqid('FOREIGN'), 'buyer_id' => $other->id, 'tipe' => 'produk', 'status' => 'Lunas']);

        $response = $this->actingAs($buyer)->get(route('customer.riwayat'))->assertOk();
        $history = collect($response->inertiaProps('riwayat'));
        $this->assertCount(count($rows), $history);
        $this->assertEqualsCanonicalizing(array_map(fn ($row) => $row->id, $rows), $history->pluck('id')->all());
        foreach ($rows as $row) {
            $this->assertSame(route('customer.pengajuan.show', $row), $history->firstWhere('id', $row->id)['detail_url']);
            $this->get(route('customer.pengajuan.show', $row))->assertOk();
        }
        $this->get(route('customer.pengajuan.show', $foreign))->assertForbidden();
        $this->actingAs($other)->get(route('customer.pengajuan.show', $rows[0]))->assertForbidden();
    }
}

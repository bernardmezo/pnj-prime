<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Setting;
use App\Models\User;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TaxRateSeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PimpinanRentalApprovalFlowTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected User $adminRtpu;

    protected User $pimpinanRtpu;

    protected Product $roomProduct;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ProductCategorySeeder::class);
        $this->seed(SettingSeeder::class);
        $this->seed(TaxRateSeeder::class);
        $this->seed(UsecaseSeeder::class);

        $this->customer = User::factory()->create(['role' => 'customer']);
        $this->adminRtpu = User::factory()->create(['role' => 'admin_rtpu']);
        $this->pimpinanRtpu = User::factory()->create(['role' => 'pimpinan_rtpu']);

        $cat = ProductCategory::first();
        $this->roomProduct = Product::create([
            'owner_id' => $this->customer->id,
            'category_id' => $cat->id,
            'name' => 'Lab Komputasi Awan',
            'slug' => 'lab-komputasi-awan',
            'base_price' => 750000,
            'final_price' => 750000,
            'stock' => 1,
            'is_active' => true,
            'curation_status' => 'approved',
        ]);
    }

    public function test_rental_pengajuan_routes_to_pimpinan_when_setting_enabled(): void
    {
        Setting::updateOrCreate(
            ['key' => 'sewa_perlu_persetujuan_pimpinan'],
            ['value' => '1']
        );

        $pengajuan = Pengajuan::create([
            'code' => 'PNJ-RENT-001',
            'buyer_id' => $this->customer->id,
            'product_id' => $this->roomProduct->id,
            'tipe' => 'ruangan',
            'keperluan' => 'Uji Beban Server',
            'jumlah' => 1,
            'total' => 750000,
            'status' => 'Diajukan',
        ]);

        // Admin RTPU reviews documents and approves
        $this->actingAs($this->adminRtpu);
        $res = $this->patch(route('rtpu.verify.layanan.approve', $pengajuan));
        $res->assertRedirect();

        $pengajuan->refresh();
        $this->assertSame('Menunggu Persetujuan Pimpinan', $pengajuan->status);

        // Pimpinan RTPU sees it in the queue
        $this->actingAs($this->pimpinanRtpu);
        $list = $this->get(route('pimpinan.pengajuan'));
        $list->assertOk();

        // Pimpinan RTPU approves the rental
        $app = $this->patch(route('pimpinan.pengajuan.approve', $pengajuan));
        $app->assertRedirect();

        $pengajuan->refresh();
        $this->assertSame('Menunggu Pembayaran', $pengajuan->status);

        // An Order must have been created for billing
        $order = Order::where('pengajuan_id', $pengajuan->id)->firstOrFail();
        $this->assertSame('menunggu_pembayaran', $order->status);
        $this->assertSame('b2b', $order->order_type);
        $this->assertSame(750000, (int) $order->subtotal);
    }

    public function test_pimpinan_can_reject_rental_with_reason(): void
    {
        $pengajuan = Pengajuan::create([
            'code' => 'PNJ-RENT-002',
            'buyer_id' => $this->customer->id,
            'product_id' => $this->roomProduct->id,
            'tipe' => 'ruangan',
            'keperluan' => 'Kegiatan Non-Akademik',
            'jumlah' => 1,
            'total' => 750000,
            'status' => 'Menunggu Persetujuan Pimpinan',
        ]);

        $this->actingAs($this->pimpinanRtpu);

        $res = $this->patch(route('pimpinan.pengajuan.reject', $pengajuan), [
            'catatan' => 'Fasilitas sedang dalam masa pemeliharaan rutin oleh teknisi.',
        ]);
        $res->assertRedirect();

        $pengajuan->refresh();
        $this->assertSame('Ditolak', $pengajuan->status);
        $this->assertSame('Fasilitas sedang dalam masa pemeliharaan rutin oleh teknisi.', $pengajuan->catatan_peninjau);
    }
}

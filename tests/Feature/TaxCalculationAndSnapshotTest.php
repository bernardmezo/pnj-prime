<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\TaxRate;
use App\Models\User;
use App\Services\PengajuanWorkflow;
use App\Services\TaxService;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TaxRateSeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaxCalculationAndSnapshotTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected User $adminRtpu;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ProductCategorySeeder::class);
        $this->seed(SettingSeeder::class);
        $this->seed(TaxRateSeeder::class);
        $this->seed(UsecaseSeeder::class);

        $this->customer = User::factory()->create(['role' => 'customer']);
        $this->adminRtpu = User::factory()->create(['role' => 'admin_rtpu']);
    }

    public function test_tax_rate_crud_by_admin(): void
    {
        $this->actingAs($this->adminRtpu);

        $res = $this->post(route('admin.tax-rates.store'), [
            'code' => 'PPN_CUSTOM_12',
            'name' => 'PPN Khusus 12%',
            'rate' => 12.00,
            'category' => 'jasa',
            'threshold_amount' => 100000,
            'is_active' => true,
        ]);
        $res->assertSessionHasNoErrors();
        $res->assertRedirect();

        $rate = TaxRate::where('code', 'PPN_CUSTOM_12')->firstOrFail();
        $this->assertSame('PPN Khusus 12%', $rate->name);
        $this->assertEquals(12.00, $rate->rate);

        $update = $this->patch(route('admin.tax-rates.update', $rate), [
            'rate' => 12.50,
        ]);
        $update->assertRedirect();
        $this->assertEquals(12.50, $rate->fresh()->rate);

        $del = $this->delete(route('admin.tax-rates.destroy', $rate));
        $del->assertRedirect();
        $this->assertSoftDeleted('tax_rates', ['id' => $rate->id]);
    }

    public function test_tax_service_calculation(): void
    {
        $taxService = new TaxService;
        $rate = TaxRate::where('code', 'PPN11')->firstOrFail();

        $calc = $taxService->calculate(1000000, $rate);

        $this->assertSame(1000000, $calc['subtotal']);
        $this->assertSame(110000, $calc['tax_amount']);
        $this->assertSame(1110000, $calc['total']);
        $this->assertSame($rate->id, $calc['tax_rate_id']);
        $this->assertEquals(11.00, $calc['tax_rate_snapshot']);
    }

    public function test_approval_creates_immutable_order_snapshot_with_tax(): void
    {
        $category = ProductCategory::first();
        $taxRate = TaxRate::where('code', 'PPN11')->firstOrFail();

        $product = Product::create([
            'owner_id' => $this->customer->id,
            'category_id' => $category->id,
            'name' => 'Konsultasi Riset',
            'slug' => 'konsultasi-riset-tax-test',
            'base_price' => 500000,
            'final_price' => 500000,
            'stock' => 10,
            'is_active' => true,
            'curation_status' => 'approved',
            'tax_rate_id' => $taxRate->id,
        ]);

        $pengajuan = Pengajuan::create([
            'code' => 'PNJ-TEST-TAX-01',
            'buyer_id' => $this->customer->id,
            'product_id' => $product->id,
            'tipe' => 'jasa',
            'keperluan' => 'Konsultasi AI',
            'jumlah' => 1,
            'total' => 500000,
            'status' => 'Diajukan',
        ]);

        $workflow = app(PengajuanWorkflow::class);
        $workflow->transition($pengajuan, 'Menunggu Pembayaran', 'Disetujui Admin', 'Admin Test');

        $pengajuan->refresh();
        $this->assertSame('Menunggu Pembayaran', $pengajuan->status);

        $order = Order::where('pengajuan_id', $pengajuan->id)->firstOrFail();
        $this->assertSame(500000, (int) $order->subtotal);
        $this->assertSame(55000, (int) $order->tax_amount);
        $this->assertSame(555000, (int) $order->total);
        $this->assertSame($taxRate->id, $order->tax_rate_id);
        $this->assertEquals(11.00, $order->tax_rate_snapshot);
        $this->assertSame('PPN 11%', $order->tax_name_snapshot);

        // Check OrderItem was created
        $this->assertCount(1, $order->items);
        $this->assertSame('Konsultasi Riset', $order->items->first()->product_name);
    }
}

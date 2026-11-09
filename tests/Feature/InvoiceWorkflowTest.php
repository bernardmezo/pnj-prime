<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TaxRateSeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InvoiceWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected User $otherCustomer;

    protected User $adminRtpu;

    protected Product $product;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ProductCategorySeeder::class);
        $this->seed(SettingSeeder::class);
        $this->seed(TaxRateSeeder::class);
        $this->seed(UsecaseSeeder::class);

        $this->customer = User::factory()->create(['role' => 'customer']);
        $this->otherCustomer = User::factory()->create(['role' => 'customer']);
        $this->adminRtpu = User::factory()->create(['role' => 'admin_rtpu']);

        $category = ProductCategory::first() ?? ProductCategory::create(['name' => 'Uji Lab', 'slug' => 'uji-lab']);
        $this->product = Product::create([
            'category_id' => $category->id,
            'owner_id' => $this->customer->id,
            'name' => 'Layanan Kalibrasi Mesin',
            'slug' => 'layanan-kalibrasi-mesin',
            'base_price' => 1000000,
            'final_price' => 1000000,
            'is_active' => true,
            'curation_status' => 'approved',
        ]);
    }

    public function test_rtpu_can_issue_official_invoice_for_pengajuan_in_menunggu_invoice(): void
    {
        $pengajuan = Pengajuan::create([
            'code' => 'PNJ-20261106-0001',
            'buyer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'tipe' => 'jasa',
            'keperluan' => 'Pengujian kalibrasi',
            'total' => 1000000,
            'status' => 'Menunggu Invoice',
        ]);

        $pengajuan->order()->create([
            'order_number' => 'ORD-20261106-0001',
            'buyer_id' => $this->customer->id,
            'subtotal' => 1000000,
            'tax_amount' => 120000,
            'total' => 1120000,
            'status' => 'menunggu_invoice',
        ]);

        $response = $this->actingAs($this->adminRtpu)
            ->post(route('rtpu.invoice.store', $pengajuan));

        $response->assertRedirect();
        $this->assertEquals('Menunggu Pembayaran', $pengajuan->fresh()->status);

        $invoice = Invoice::where('pengajuan_id', $pengajuan->id)->first();
        $this->assertNotNull($invoice);
        $this->assertStringStartsWith('INV-'.date('Ymd'), $invoice->invoice_number);
        $this->assertEquals('issued', $invoice->status);
        $this->assertEquals(1000000, (int) $invoice->subtotal);
        $this->assertGreaterThan(0, (int) $invoice->tax_amount);
        $this->assertCount(1, $invoice->lines);
    }

    public function test_cannot_issue_invoice_if_not_in_menunggu_invoice_state(): void
    {
        $pengajuan = Pengajuan::create([
            'code' => 'PNJ-20261106-0002',
            'buyer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'tipe' => 'jasa',
            'keperluan' => 'Pengujian',
            'total' => 1000000,
            'status' => 'Diajukan',
        ]);

        $response = $this->actingAs($this->adminRtpu)
            ->post(route('rtpu.invoice.store', $pengajuan));

        $response->assertStatus(422);
    }

    public function test_customer_can_view_and_print_their_own_invoice(): void
    {
        $pengajuan = Pengajuan::create([
            'code' => 'PNJ-20261106-0003',
            'buyer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'tipe' => 'jasa',
            'keperluan' => 'Pengujian',
            'total' => 1000000,
            'status' => 'Menunggu Invoice',
        ]);

        // Issue invoice
        $this->actingAs($this->adminRtpu)
            ->post(route('rtpu.invoice.store', $pengajuan));

        // Customer views invoice
        $showRes = $this->actingAs($this->customer)
            ->get(route('customer.pengajuan.invoice', $pengajuan));
        $showRes->assertStatus(200);

        // Customer prints invoice
        $printRes = $this->actingAs($this->customer)
            ->get(route('customer.pengajuan.invoice.print', $pengajuan));
        $printRes->assertStatus(200);
        $printRes->assertSee('INVOICE RESMI');
    }

    public function test_other_customer_cannot_view_or_print_invoice(): void
    {
        $pengajuan = Pengajuan::create([
            'code' => 'PNJ-20261106-0004',
            'buyer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'tipe' => 'jasa',
            'keperluan' => 'Pengujian',
            'total' => 1000000,
            'status' => 'Menunggu Invoice',
        ]);

        $this->actingAs($this->adminRtpu)
            ->post(route('rtpu.invoice.store', $pengajuan));

        $res = $this->actingAs($this->otherCustomer)
            ->get(route('customer.pengajuan.invoice', $pengajuan));
        $res->assertStatus(403);

        $printRes = $this->actingAs($this->otherCustomer)
            ->get(route('customer.pengajuan.invoice.print', $pengajuan));
        $printRes->assertStatus(403);
    }

    public function test_rtpu_can_cancel_issued_invoice(): void
    {
        $pengajuan = Pengajuan::create([
            'code' => 'PNJ-20261106-0005',
            'buyer_id' => $this->customer->id,
            'product_id' => $this->product->id,
            'tipe' => 'jasa',
            'keperluan' => 'Pengujian',
            'total' => 1000000,
            'status' => 'Menunggu Invoice',
        ]);

        $this->actingAs($this->adminRtpu)
            ->post(route('rtpu.invoice.store', $pengajuan));

        $invoice = Invoice::where('pengajuan_id', $pengajuan->id)->first();

        $cancelRes = $this->actingAs($this->adminRtpu)
            ->patch(route('rtpu.invoice.cancel', $invoice), [
                'reason' => 'Perubahan rincian pesanan oleh pemohon.',
            ]);

        $cancelRes->assertRedirect();
        $this->assertEquals('cancelled', $invoice->fresh()->status);
    }
}

<?php

namespace Tests\Feature;

use App\Models\MetodePembayaran;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Services\InvoiceService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RentalInvoiceFrozenPriceTest extends TestCase
{
    use RefreshDatabase;

    public function test_customer_invoice_and_print_show_saved_rental_duration(): void
    {
        $buyer = User::factory()->customer()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $category = ProductCategory::create(['name' => 'Sewa', 'slug' => 'sewa-fasilitas', 'is_active' => true]);
        $product = Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Aula', 'slug' => 'aula', 'base_price' => 100, 'final_price' => 100, 'is_active' => true, 'curation_status' => 'approved']);
        $request = Pengajuan::create(['code' => 'TEST-DURATION', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'ruangan', 'status' => 'Menunggu Pembayaran', 'total' => 300, 'rental_start' => now()->addDay(), 'rental_end' => now()->addDay()->addHours(3)]);
        $request->rental_billing_duration = 3;
        $request->rental_billing_unit = 'per_jam';
        $request->save();
        $request->invoices()->create(['invoice_number' => 'INV-DURATION', 'status' => 'issued', 'subtotal' => 300, 'tax_rate_snapshot' => 0, 'tax_amount' => 0, 'total' => 300]);

        foreach (['customer.pengajuan.invoice', 'customer.pengajuan.invoice.print'] as $route) {
            $this->actingAs($buyer)->get(route($route, $request))->assertOk()->assertSee('Durasi Sewa')->assertSee('3 jam');
        }
    }

    public function test_invoice_uses_submitted_total_instead_of_changed_catalog_price(): void
    {
        $buyer = User::factory()->customer()->create();
        $issuer = User::factory()->create(['role' => 'admin_rtpu']);
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $category = ProductCategory::create(['name' => 'Sewa', 'slug' => 'sewa-fasilitas', 'is_active' => true]);
        $product = Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Aula', 'slug' => 'aula', 'base_price' => 900, 'final_price' => 900, 'is_active' => true, 'curation_status' => 'approved', 'meta' => ['satuan' => 'hari']]);
        $request = Pengajuan::create(['code' => 'TEST-1', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'ruangan', 'status' => 'Menunggu Invoice', 'jumlah' => '2', 'total' => 200, 'rental_start' => now()->addDays(1), 'rental_end' => now()->addDays(3)]);
        $bank = MetodePembayaran::create(['nama' => 'BLU', 'tipe' => 'BLU', 'rekening' => '123', 'holder' => 'PNJ', 'aktif' => true]);
        $request->opsi()->create(['jenis' => 'addon', 'nama' => 'Kursi', 'harga' => 50, 'satuan' => 'flat', 'qty' => 1, 'subtotal' => 50]);
        $request->update(['total' => 250, 'jam_mulai' => '08:00', 'jam_selesai' => '12:00']);
        $invoice = app(InvoiceService::class)->prepareRental($request, $issuer, ['bank_id' => $bank->id, 'due_date' => now()->addDays(4)->toDateString(), 'unit_price' => 5000, 'tax_rate' => '12.50']);
        $this->assertSame(250, (int) $invoice->subtotal);
        $this->assertEquals(12.5, $invoice->tax_rate_snapshot);
        $this->assertSame(31, (int) $invoice->tax_amount);
        $this->assertSame(281, (int) $invoice->total);
        $this->assertSame(250, (int) $invoice->lines()->sum('amount'));
        $this->assertSame(1, (int) $invoice->lines()->firstOrFail()->quantity);
        $this->assertSame(200, (int) $invoice->lines()->firstOrFail()->unit_price);
        try {
            app(InvoiceService::class)->prepareRental($request, $issuer, ['bank_id' => $bank->id, 'due_date' => now()->addDays(4)->toDateString()]);
            $this->fail('An existing invoice must not be replaced.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            $this->assertSame(1, $request->invoices()->count());
            $this->assertSame(250, (int) $invoice->fresh()->subtotal);
        }
        \Illuminate\Support\Facades\Notification::fake();
        app(InvoiceService::class)->approveRental($request, $issuer);
        $order = $request->fresh()->order;
        $this->assertSame(281, (int) $order->total);
        $this->assertSame(250, (int) $order->items()->sum('subtotal'));
        $this->assertSame(['Aula', 'Kursi'], $order->items()->orderBy('id')->pluck('product_name')->all());
        $this->assertSame([200, 50], $order->items()->orderBy('id')->pluck('subtotal')->map(fn ($v) => (int) $v)->all());
        $this->assertSame('issued', $invoice->fresh()->status);
    }
}

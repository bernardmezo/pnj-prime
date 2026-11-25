<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentRejectionRegressionTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(string $type = 'jasa', string $status = 'Menunggu Verifikasi Pembayaran'): array
    {
        $buyer = User::factory()->customer()->create();
        $admin = User::factory()->adminRtpu()->create();
        $category = ProductCategory::create(['name' => 'Test', 'slug' => 'test']);
        $product = Product::create(['category_id' => $category->id, 'owner_id' => $buyer->id, 'name' => 'Test', 'slug' => 'test', 'base_price' => 10000, 'final_price' => 10000]);
        $request = Pengajuan::create(['code' => 'TEST-1', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => $type, 'total' => 10000, 'status' => $status]);
        $order = $request->order()->create(['order_number' => 'TEST-1', 'buyer_id' => $buyer->id, 'subtotal' => 10000, 'tax_amount' => 0, 'total' => 10000, 'status' => $status === 'Lunas' ? 'lunas' : 'menunggu_verifikasi']);
        $proof = $order->paymentProofs()->create(['file_path' => 'test.pdf', 'file_name' => 'test.pdf', 'mime_type' => 'application/pdf', 'verification_status' => 'pending']);
        return [$request, $order, $proof, $admin, $buyer];
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
    }

    public function test_legacy_proof_without_invoice_can_be_rejected(): void
    {
        [$request, $order, $proof, $admin] = $this->fixture();
        $this->actingAs($admin)->patch(route('rtpu.verify.bayar.reject', $proof), ['catatan' => 'Tidak terbaca'])->assertRedirect();
        $this->assertSame('rejected', $proof->fresh()->verification_status);
        $this->assertSame('Menunggu Pembayaran', $request->fresh()->status);
        $this->assertSame('menunggu_pembayaran', $order->fresh()->status);
    }

    public function test_stale_ready_stock_proof_cannot_reopen_paid_order(): void
    {
        [$request, $order, $proof, $admin] = $this->fixture('produk', 'Lunas');
        $this->actingAs($admin)->patch(route('rtpu.verify.bayar.reject', $proof), ['catatan' => 'Tidak terbaca'])->assertStatus(422);
        $this->assertSame('pending', $proof->fresh()->verification_status);
        $this->assertSame('Lunas', $request->fresh()->status);
        $this->assertSame('lunas', $order->fresh()->status);
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('settlementSequences')]
    public function test_webhook_and_polling_are_idempotent_in_both_orders(string $sequence): void
    {
            [$request, $order, , , $buyer] = $this->fixture('produk');
            $request->update(['status' => 'Menunggu Pembayaran']);
            $order->update(['status' => 'menunggu_pembayaran']);
            $payment = \App\Models\Payment::create(['request_id' => $request->id, 'order_id' => 'gateway-test', 'gross_amount' => 10000, 'status' => 'pending']);
            config(['services.midtrans.server_key' => 'test-key']);
            \Illuminate\Support\Facades\Http::fake(['*' => \Illuminate\Support\Facades\Http::response(['transaction_status' => 'settlement', 'gross_amount' => '10000.00'], 200)]);
            \Illuminate\Support\Facades\Notification::fake();
            $webhook = fn () => $this->postJson(route('api.midtrans.notification'), ['order_id' => 'gateway-test', 'status_code' => '200', 'gross_amount' => '10000.00', 'signature_key' => hash('sha512', 'gateway-test'.'200'.'10000.00'.'test-key')])->assertOk();
            $poll = fn () => $this->actingAs($buyer)->getJson(route('customer.pengajuan.pembayaran.status', $request))->assertOk();
            if ($sequence === 'webhook-first') { $webhook(); $poll(); } else { $poll(); $webhook(); }
            $webhook();
            $poll();
            $this->assertSame('paid', $payment->fresh()->status);
            $this->assertSame('Lunas', $request->fresh()->status);
            $this->assertSame('lunas', $order->fresh()->status);
            \Illuminate\Support\Facades\Notification::assertSentToTimes($buyer, \App\Notifications\ProductPaymentReceived::class, 1);
    }

    public static function settlementSequences(): array
    {
        return [['webhook-first'], ['poll-first']];
    }

    public function test_customer_cannot_reject_proof(): void
    {
        [$request, $order, $proof, , $buyer] = $this->fixture();
        $this->actingAs($buyer)->patch(route('rtpu.verify.bayar.reject', $proof), ['catatan' => 'Tidak terbaca'])->assertForbidden();
        $this->assertSame('pending', $proof->fresh()->verification_status);
    }
}

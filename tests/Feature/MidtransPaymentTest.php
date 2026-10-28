<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MidtransPaymentTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private User $otherUser;

    private Pengajuan $pengajuan;

    private string $serverKey = 'test-server-key';

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('services.midtrans.server_key', $this->serverKey);
        Config::set('services.midtrans.client_key', 'test-client-key');
        Config::set('services.midtrans.is_production', false);

        $this->seed(UsecaseSeeder::class);

        $this->customer = User::factory()->create(['role' => 'customer']);
        $this->otherUser = User::factory()->create(['role' => 'customer']);

        $category = ProductCategory::create(['name' => 'Uji Lab', 'slug' => 'uji-lab']);
        $product = Product::create([
            'category_id' => $category->id,
            'owner_id' => $this->customer->id,
            'name' => 'Layanan Kalibrasi',
            'slug' => 'layanan-kalibrasi',
            'base_price' => 500000,
            'final_price' => 500000,
            'is_active' => true,
            'curation_status' => 'approved',
        ]);

        $this->pengajuan = Pengajuan::create([
            'code' => 'PNJ-20261028-0001',
            'buyer_id' => $this->customer->id,
            'product_id' => $product->id,
            'tipe' => 'jasa',
            'keperluan' => 'Pengujian',
            'total' => 500000,
            'status' => 'Menunggu Pembayaran',
        ]);

        $this->pengajuan->order()->create([
            'order_number' => 'PNJ-20261028-0001',
            'buyer_id' => $this->customer->id,
            'subtotal' => 500000,
            'tax_amount' => 60000,
            'total' => 560000,
            'status' => 'menunggu_pembayaran',
        ]);
    }

    public function test_customer_can_create_snap_payment_token(): void
    {
        Http::fake([
            'https://app.sandbox.midtrans.com/snap/v1/transactions' => Http::response([
                'token' => 'dummy-snap-token-12345',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/dummy',
            ], 201),
        ]);

        $response = $this->actingAs($this->customer)
            ->postJson(route('customer.pengajuan.pembayaran.create', $this->pengajuan));

        $response->assertOk()
            ->assertJson([
                'token' => 'dummy-snap-token-12345',
            ]);

        $this->assertDatabaseHas('payments', [
            'request_id' => $this->pengajuan->id,
            'gross_amount' => 560000,
            'snap_token' => 'dummy-snap-token-12345',
            'status' => 'pending',
        ]);
    }

    public function test_non_owner_cannot_create_snap_payment(): void
    {
        $response = $this->actingAs($this->otherUser)
            ->postJson(route('customer.pengajuan.pembayaran.create', $this->pengajuan));

        $response->assertForbidden();
    }

    public function test_cannot_create_payment_if_not_waiting_for_payment(): void
    {
        $this->pengajuan->update(['status' => 'Diproses']);

        $response = $this->actingAs($this->customer)
            ->postJson(route('customer.pengajuan.pembayaran.create', $this->pengajuan));

        $response->assertForbidden();
    }

    public function test_webhook_rejects_invalid_signature_with_403(): void
    {
        $response = $this->postJson(route('api.midtrans.notification'), [
            'order_id' => 'PNJ-20261028-0001-test',
            'status_code' => '200',
            'gross_amount' => '560000.00',
            'signature_key' => 'invalid-signature-hash',
        ]);

        $response->assertStatus(403);
    }

    public function test_webhook_processes_successful_settlement_and_moves_status_to_diproses(): void
    {
        $orderId = 'PNJ-20261028-0001-abcdef';
        $grossAmount = '560000.00';
        $statusCode = '200';
        $signature = hash('sha512', $orderId.$statusCode.$grossAmount.$this->serverKey);

        $payment = Payment::create([
            'request_id' => $this->pengajuan->id,
            'order_id' => $orderId,
            'gross_amount' => 560000,
            'snap_token' => 'snap-token-xyz',
            'status' => 'pending',
        ]);

        Http::fake([
            'https://api.sandbox.midtrans.com/v2/'.urlencode($orderId).'/status' => Http::response([
                'order_id' => $orderId,
                'status_code' => '200',
                'transaction_status' => 'settlement',
                'fraud_status' => 'accept',
                'gross_amount' => '560000.00',
                'payment_type' => 'bank_transfer',
                'transaction_id' => 'trx-123456789',
                'settlement_time' => '2026-10-29 02:00:00',
            ], 200),
        ]);

        $response = $this->postJson(route('api.midtrans.notification'), [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
        ]);

        $response->assertOk();

        $this->assertEquals('paid', $payment->fresh()->status);
        $this->assertEquals('bank_transfer', $payment->fresh()->payment_type);
        $this->assertEquals('trx-123456789', $payment->fresh()->transaction_id);

        $this->assertEquals('Diproses', $this->pengajuan->fresh()->status);
        $this->assertEquals('diproses', $this->pengajuan->order->fresh()->status);
    }

    public function test_webhook_is_idempotent_and_does_not_reprocess_paid(): void
    {
        $orderId = 'PNJ-20261028-0001-idemp';
        $grossAmount = '560000.00';
        $statusCode = '200';
        $signature = hash('sha512', $orderId.$statusCode.$grossAmount.$this->serverKey);

        $payment = Payment::create([
            'request_id' => $this->pengajuan->id,
            'order_id' => $orderId,
            'gross_amount' => 560000,
            'snap_token' => 'snap-token-xyz',
            'status' => 'paid',
            'paid_at' => now(),
        ]);

        Http::fake([
            'https://api.sandbox.midtrans.com/v2/'.urlencode($orderId).'/status' => Http::response([
                'order_id' => $orderId,
                'status_code' => '200',
                'transaction_status' => 'settlement',
                'gross_amount' => '560000.00',
            ], 200),
        ]);

        $response = $this->postJson(route('api.midtrans.notification'), [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
        ]);

        $response->assertOk()
            ->assertJson(['message' => 'Payment already paid.']);
    }

    public function test_webhook_rejects_amount_mismatch(): void
    {
        $orderId = 'PNJ-20261028-0001-mismatch';
        $grossAmount = '560000.00';
        $statusCode = '200';
        $signature = hash('sha512', $orderId.$statusCode.$grossAmount.$this->serverKey);

        Payment::create([
            'request_id' => $this->pengajuan->id,
            'order_id' => $orderId,
            'gross_amount' => 560000,
            'snap_token' => 'snap-token-xyz',
            'status' => 'pending',
        ]);

        Http::fake([
            'https://api.sandbox.midtrans.com/v2/'.urlencode($orderId).'/status' => Http::response([
                'order_id' => $orderId,
                'status_code' => '200',
                'transaction_status' => 'settlement',
                'gross_amount' => '999999.00', // mismatched!
            ], 200),
        ]);

        $response = $this->postJson(route('api.midtrans.notification'), [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
        ]);

        $response->assertStatus(400);
    }
}

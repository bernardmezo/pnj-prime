<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MidtransPaymentTest extends TestCase
{
    private User $customer;

    private User $otherUser;

    private Pengajuan $pengajuan;

    private string $serverKey = 'test-server-key';

    protected function setUp(): void
    {
        parent::setUp();

        $connection = config('database.default');
        $database = config("database.connections.{$connection}");
        if (($database['driver'] ?? null) !== 'sqlite' || ($database['database'] ?? null) !== ':memory:' || ! empty($database['url'])) {
            throw new \LogicException('This destructive test requires isolated in-memory SQLite.');
        }
        $this->artisan('migrate:fresh')->assertExitCode(0);
        $this->assertSame(0, DB::transactionLevel());

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
            'tipe' => 'produk',
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

    public function test_webhook_settles_a_legacy_jasa_payment(): void
    {
        $this->pengajuan->update(['tipe' => 'jasa']);
        $orderId = 'legacy-jasa';
        $payment = Payment::create(['request_id' => $this->pengajuan->id, 'order_id' => $orderId, 'gross_amount' => 560000, 'status' => 'pending']);
        Http::fake(['*' => Http::response(['order_id' => $payment->order_id, 'transaction_status' => 'settlement', 'gross_amount' => '560000.00'], 200)]);
        $response = $this->postJson(route('api.midtrans.notification'), [
            'order_id' => $orderId, 'status_code' => '200', 'gross_amount' => '560000.00',
            'signature_key' => hash('sha512', $orderId.'200'.'560000.00'.$this->serverKey),
        ]);
        $response->assertOk();
        $this->assertSame('paid', $payment->fresh()->status);
        $this->assertSame('Lunas', $this->pengajuan->fresh()->status);
    }

    public function test_legacy_rental_polling_settles_existing_payment(): void
    {
        $this->pengajuan->update(['tipe' => 'alat']);
        $payment = Payment::create(['request_id' => $this->pengajuan->id, 'order_id' => 'legacy-alat', 'gross_amount' => 560000, 'status' => 'pending']);
        Http::fake(['*' => Http::response(['order_id' => $payment->order_id, 'transaction_status' => 'settlement', 'gross_amount' => '560000.00'], 200)]);
        $this->actingAs($this->customer)->getJson(route('customer.pengajuan.pembayaran.status', $this->pengajuan))->assertOk()->assertJson(['payment_status' => 'paid', 'status' => 'Lunas']);
        $this->assertSame('paid', $payment->fresh()->status);
    }

    public function test_manual_upload_is_blocked_while_legacy_gateway_payment_is_pending(): void
    {
        $this->pengajuan->update(['tipe' => 'ruangan']);
        Payment::create(['request_id' => $this->pengajuan->id, 'order_id' => 'legacy-rental', 'gross_amount' => 560000, 'status' => 'pending']);
        try {
            app(\App\Services\ManualPreorderPayment::class)->upload($this->pengajuan, $this->customer, 1, \Illuminate\Http\UploadedFile::fake()->image('proof.jpg'));
            $this->fail('Pending gateway must block manual payment.');
        } catch (\Illuminate\Validation\ValidationException $e) {
            $this->assertArrayHasKey('payment', $e->errors());
        }
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

        $this->assertEquals('Lunas', $this->pengajuan->fresh()->status);
        $this->assertEquals('lunas', $this->pengajuan->order->fresh()->status);
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

    public function test_challenged_capture_remains_pending(): void
    {
        $payment = Payment::create(['request_id' => $this->pengajuan->id, 'order_id' => 'challenge', 'gross_amount' => 560000, 'status' => 'pending']);
        Http::fake(['*' => Http::response(['order_id' => 'challenge', 'transaction_status' => 'capture', 'fraud_status' => 'challenge', 'gross_amount' => '560000.00'])]);
        $this->postJson(route('api.midtrans.notification'), ['order_id' => 'challenge', 'status_code' => '200', 'gross_amount' => '560000.00', 'signature_key' => hash('sha512', 'challenge200560000.00'.$this->serverKey)])->assertOk();
        $this->assertSame('pending', $payment->fresh()->status);
    }

    public function test_polling_persists_expired_status(): void
    {
        $payment = Payment::create(['request_id' => $this->pengajuan->id, 'order_id' => 'expired-test', 'gross_amount' => 560000, 'status' => 'pending']);
        Http::fake(['*' => Http::response(['order_id' => 'expired-test', 'transaction_status' => 'expire', 'gross_amount' => '560000.00'])]);
        $this->actingAs($this->customer)->getJson(route('customer.pengajuan.pembayaran.status', $this->pengajuan))->assertOk()->assertJson(['payment_status' => 'expired']);
        $this->assertSame('expired', $payment->fresh()->status);
    }

    public function test_webhook_rejects_fractional_or_wrong_order_response(): void
    {
        $payment = Payment::create(['request_id' => $this->pengajuan->id, 'order_id' => 'identity-test', 'gross_amount' => 560000, 'status' => 'pending']);
        $body = ['order_id' => 'identity-test', 'status_code' => '200', 'gross_amount' => '560000.00', 'signature_key' => hash('sha512', 'identity-test200560000.00'.$this->serverKey)];
        Http::fake(['*' => Http::response(['order_id' => 'identity-test', 'transaction_status' => 'settlement', 'gross_amount' => '560000.01'])]);
        $this->postJson(route('api.midtrans.notification'), $body)->assertStatus(400);
        Http::fake(['*' => Http::response(['order_id' => 'different', 'transaction_status' => 'settlement', 'gross_amount' => '560000.00'])]);
        $this->postJson(route('api.midtrans.notification'), $body)->assertStatus(400);
        $this->assertSame('pending', $payment->fresh()->status);
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

<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Services\MidtransService;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class MidtransRaceRegressionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== ':memory:') {
            throw new \LogicException('This destructive test requires isolated in-memory SQLite.');
        }
        $this->artisan('migrate:fresh');
    }

    private function requestFixture(string $type = 'produk', array $meta = []): Pengajuan
    {
        $buyer = User::factory()->create(['role' => 'customer']);
        $category = ProductCategory::create(['name' => 'Test', 'slug' => 'test']);
        $product = Product::create(['category_id' => $category->id, 'owner_id' => $buyer->id, 'name' => 'Test', 'slug' => 'test', 'base_price' => 10000, 'final_price' => 10000, 'is_active' => true, 'curation_status' => 'approved', 'meta' => $meta]);
        $request = Pengajuan::create(['code' => 'TEST-1', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => $type, 'total' => 10000, 'status' => 'Menunggu Pembayaran']);
        $request->order()->create(['order_number' => 'TEST-1', 'buyer_id' => $buyer->id, 'subtotal' => 10000, 'tax_amount' => 0, 'total' => 10000, 'status' => 'menunggu_pembayaran']);
        return $request;
    }

    public function test_snap_request_is_sent_after_reservation_transaction_commits(): void
    {
        $request = $this->requestFixture();
        $outerLevel = \Illuminate\Support\Facades\DB::transactionLevel();
        Http::fake(function () use ($request, $outerLevel) {
            $this->assertSame($outerLevel, \Illuminate\Support\Facades\DB::transactionLevel());
            $this->assertSame(1, $request->payments()->where('status', 'pending')->count());
            return Http::response(['token' => 'test-token'], 201);
        });

        app(MidtransService::class)->createSnapPayment($request);
    }

    public function test_snap_timeout_keeps_a_gateway_attempt_for_reconciliation(): void
    {
        $request = $this->requestFixture();
        Http::fake(fn () => throw new \Illuminate\Http\Client\ConnectionException('timeout'));

        try {
            app(MidtransService::class)->createSnapPayment($request);
            $this->fail('The uncertain Snap request must not succeed.');
        } catch (\Throwable $e) {
            $this->assertSame(1, $request->payments()->where('status', 'pending')->count());
        }
    }

    public function test_legacy_manual_verification_does_not_override_pending_gateway(): void
    {
        $request = $this->requestFixture();
        $request->update(['status' => 'Menunggu Verifikasi Pembayaran']);
        $proof = $request->order->paymentProofs()->create(['file_path' => 'test.pdf', 'file_name' => 'test.pdf', 'mime_type' => 'application/pdf', 'verification_status' => 'pending']);
        Payment::create(['request_id' => $request->id, 'order_id' => 'active-gateway', 'gross_amount' => 10000, 'status' => 'pending']);
        $admin = User::factory()->create(['role' => 'admin_rtpu']);
        \Illuminate\Support\Facades\Notification::fake();
        \Illuminate\Support\Facades\Auth::login($admin);
        try {
            app(\App\Http\Controllers\Rtpu\VerifikasiController::class)->acceptBayar($proof);
            $this->fail('Manual verification must be blocked.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('payment', $e->errors());
        }
        $this->assertSame('pending', $proof->fresh()->verification_status);
        $this->assertSame('Menunggu Verifikasi Pembayaran', $request->fresh()->status);
    }

    public function test_stale_request_cannot_create_gateway_after_manual_proof_wins(): void
    {
        $request = $this->requestFixture();
        $request->newQuery()->whereKey($request->id)->update(['status' => 'Menunggu Verifikasi Pembayaran']);
        Http::fake(['*' => Http::response(['token' => 'test-token'], 201)]);
        try {
            app(MidtransService::class)->createSnapPayment($request);
            $this->fail('Stale request created a new gateway payment.');
        } catch (ValidationException $e) {
            Http::assertNothingSent();
            $this->assertSame(0, Payment::count());
        }
    }

    public function test_expired_local_token_does_not_create_a_second_live_gateway_transaction(): void
    {
        $request = $this->requestFixture();
        $payment = Payment::create(['request_id' => $request->id, 'order_id' => 'old-gateway', 'gross_amount' => 10000, 'snap_token' => 'old-token', 'status' => 'pending']);
        $payment->forceFill(['created_at' => now()->subDays(2)])->save();
        Http::fake(['*' => Http::response(['transaction_status' => 'pending'], 200)]);
        try {
            app(MidtransService::class)->createSnapPayment($request);
            $this->fail('A locally old token must not create a second transaction.');
        } catch (ValidationException $e) {
            Http::assertSentCount(1);
            $this->assertSame(1, Payment::count());
        }
    }

    public function test_late_gateway_settlement_is_recorded_without_overwriting_manual_review(): void
    {
        config(['services.midtrans.server_key' => 'test-key']);
        $request = $this->requestFixture('jasa');
        $request->update(['status' => 'Menunggu Verifikasi Pembayaran']);
        $payment = Payment::create(['request_id' => $request->id, 'order_id' => 'late-gateway', 'gross_amount' => 10000, 'status' => 'expired']);
        Http::fake(['*' => Http::response(['order_id' => $payment->order_id, 'transaction_status' => 'settlement', 'gross_amount' => '10000.00'], 200)]);
        $body = ['order_id' => 'late-gateway', 'status_code' => '200', 'gross_amount' => '10000.00', 'signature_key' => hash('sha512', 'late-gateway'.'200'.'10000.00'.'test-key')];
        $this->postJson(route('api.midtrans.notification'), $body)->assertOk();
        $this->postJson(route('api.midtrans.notification'), $body)->assertOk();
        $this->assertSame('paid', $payment->fresh()->status);
        $this->assertSame('Menunggu Verifikasi Pembayaran', $request->fresh()->status);
        $this->assertSame('menunggu_pembayaran', $request->order->fresh()->status);
    }

    public function test_real_legacy_preorder_settlement_is_recorded(): void
    {
        config(['services.midtrans.server_key' => 'test-key']);
        $request = $this->requestFixture('produk', ['availability_status' => 'preorder']);
        $payment = Payment::create(['request_id' => $request->id, 'order_id' => 'legacy-preorder', 'gross_amount' => 10000, 'status' => 'pending']);
        Http::fake(['*' => Http::response(['order_id' => $payment->order_id, 'transaction_status' => 'settlement', 'gross_amount' => '10000.00'], 200)]);
        $this->postJson(route('api.midtrans.notification'), ['order_id' => 'legacy-preorder', 'status_code' => '200', 'gross_amount' => '10000.00', 'signature_key' => hash('sha512', 'legacy-preorder'.'200'.'10000.00'.'test-key')])->assertOk();
        $this->assertSame('paid', $payment->fresh()->status);
        $this->assertSame('Lunas', $request->fresh()->status);
    }
}

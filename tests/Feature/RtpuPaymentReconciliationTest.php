<?php

namespace Tests\Feature;

use App\Models\Payment;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class RtpuPaymentReconciliationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (config('database.default') !== 'sqlite' || config('database.connections.sqlite.database') !== ':memory:' || config('database.connections.sqlite.url')) {
            throw new \LogicException('Requires isolated in-memory SQLite.');
        }
        $this->artisan('migrate:fresh');
        $this->seed(\Database\Seeders\UsecaseSeeder::class);
        User::flushPermissionCache();
    }

    private function fixture(): array
    {
        $buyer = User::factory()->customer()->create();
        $admin = User::factory()->adminRtpu()->create();
        $category = ProductCategory::create(['name' => 'Test', 'slug' => 'test']);
        $product = Product::create(['category_id' => $category->id, 'owner_id' => $buyer->id, 'name' => 'Test', 'slug' => 'test', 'base_price' => 10000, 'final_price' => 10000]);
        $request = Pengajuan::create(['code' => 'TEST-1', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'produk', 'total' => 10000, 'status' => 'Menunggu Verifikasi Pembayaran']);
        $order = $request->order()->create(['order_number' => 'TEST-1', 'buyer_id' => $buyer->id, 'subtotal' => 10000, 'tax_amount' => 0, 'total' => 10000, 'status' => 'menunggu_verifikasi']);
        $proof = $order->paymentProofs()->create(['file_path' => 'test.pdf', 'file_name' => 'test.pdf', 'mime_type' => 'application/pdf', 'verification_status' => 'pending']);
        $payment = Payment::create(['request_id' => $request->id, 'order_id' => 'late-gateway', 'gross_amount' => 10000, 'status' => 'paid', 'paid_at' => now()]);
        return [$admin, $request, $proof, $payment];
    }

    public function test_paid_gateway_conflict_is_visible_on_both_queue_details(): void
    {
        [$admin, $request, $proof, $payment] = $this->fixture();
        $this->actingAs($admin)->get(route('rtpu.verify.bayar', ['id' => 'midtrans-'.$payment->id]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->component('Rtpu/Verifikasi/Pembayaran')
                ->where('selected.reconciliation_required', true)
                ->where('selected.related_proof_id', (string) $proof->id));
        $this->get(route('rtpu.verify.bayar', ['id' => (string) $proof->id]))
            ->assertOk()->assertInertia(fn (Assert $page) => $page->where('selected.reconciliation_required', true)
                ->where('selected.can_verify', false));
    }

    public function test_conflicting_proof_cannot_be_rejected_into_a_new_payment_attempt(): void
    {
        [$admin, $request, $proof, $payment] = $this->fixture();
        Auth::login($admin);
        try {
            app(\App\Http\Controllers\Rtpu\VerifikasiController::class)->rejectBayar(\Illuminate\Http\Request::create('/', 'PATCH', ['catatan' => 'test']), $proof);
            $this->fail('Conflicting payment must block rejection.');
        } catch (ValidationException $e) {
            $this->assertArrayHasKey('payment', $e->errors());
        }
        $this->assertSame('pending', $proof->fresh()->verification_status);
        $this->assertSame('paid', $payment->fresh()->status);
        $this->assertSame('Menunggu Verifikasi Pembayaran', $request->fresh()->status);
    }
}

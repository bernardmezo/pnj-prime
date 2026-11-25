<?php

namespace Tests\Feature;

use App\Services\PengajuanWorkflow;
use Illuminate\Validation\ValidationException;

class ReadyStockShippingApprovalTest extends SqlitePreorderBluInvoiceTest
{
    public function beginDatabaseTransaction()
    {
        if ($this->name() === 'test_midtrans_payload_includes_locked_shipping_after_tax') {
            $this->assertSame('preorder_sqlite_test', config('database.default'));
            $this->assertSame(':memory:', config('database.connections.preorder_sqlite_test.database'));

            return;
        }

        parent::beginDatabaseTransaction();
    }

    private function readyFixture(string $service = 'REG', string $courier = 'JNE'): array
    {
        $fixture = new \ReflectionMethod(PreorderBluInvoiceTest::class, 'requestFixture');
        [$request, $actor] = $fixture->invoke($this);
        $request->product->update(['meta' => ['availability_status' => 'tersedia', 'weight' => 500]]);
        $request->update([
            'catatan' => "Alamat: TEST | Kota: 25979 | Kurir: {$courier} | Layanan: {$service} | Ongkir: Rp 25.000",
        ]);
        return [$request->fresh(), $actor];
    }

    public function test_direct_transition_cannot_bypass_shipping_approval(): void
    {
        [$request] = $this->readyFixture();
        $this->expectException(ValidationException::class);
        app(PengajuanWorkflow::class)->transition($request, 'Menunggu Pembayaran');
    }

    public function test_ready_stock_approval_uses_live_jne_and_snapshots_goods_tax_and_shipping(): void
    {
        [$request, $actor] = $this->readyFixture();
        $this->actingAs($actor)->patch(route('rtpu.verify.layanan.approve', $request->id), [])
            ->assertSessionHasNoErrors();

        $order = $request->fresh()->order;
        $this->assertSame(1000, $order->subtotal);
        $this->assertSame(0, $order->tax_amount);
        $this->assertSame(25000, $order->shipping_amount);
        $this->assertSame(26000, $order->total);
        $this->assertSame(['courier' => 'jne', 'service' => 'REG', 'amount' => 25000, 'etd' => '2-3 day'], $order->shipping_snapshot);
        $this->assertSame(26000, $request->fresh()->total);
    }

    public function test_midtrans_payload_includes_locked_shipping_after_tax(): void
    {
        [$request, $actor] = $this->readyFixture();
        $this->actingAs($actor)->patch(route('rtpu.verify.layanan.approve', $request->id), [])
            ->assertSessionHasNoErrors();

        \Illuminate\Support\Facades\Http::fake(['*/transactions' => \Illuminate\Support\Facades\Http::response(['token' => 'test-token'])]);
        $payment = app(\App\Services\MidtransService::class)->createSnapPayment($request->fresh());
        $this->assertSame(26000, $payment->gross_amount);
        \Illuminate\Support\Facades\Http::assertSent(fn ($http) => str_ends_with($http->url(), '/transactions')
            && $http['transaction_details']['gross_amount'] === 26000
            && collect($http['item_details'])->contains(fn ($line) => $line['id'] === 'SHIPPING-REG' && $line['price'] === 25000));
    }

    public function test_legacy_order_without_customer_service_requires_admin_service(): void
    {
        [$request, $actor] = $this->readyFixture();
        $request->update(['catatan' => 'Alamat: TEST | Kota: 25979 | Kurir: JNE']);
        // Tanpa input admin: validasi gagal, tidak ada order dibuat.
        $this->actingAs($actor)->patch(route('rtpu.verify.layanan.approve', $request->fresh()->id), [])
            ->assertSessionHasErrors('shipping_service');
        $this->assertSame('Diajukan', $request->fresh()->status);
        $this->assertNull($request->fresh()->order);
    }

    public function test_legacy_order_allows_admin_to_supply_live_service(): void
    {
        [$request, $actor] = $this->readyFixture();
        $request->update(['catatan' => 'Alamat: TEST | Kota: 25979 | Kurir: JNE']);
        $this->actingAs($actor)->patch(route('rtpu.verify.layanan.approve', $request->fresh()->id), [
            'shipping_courier' => 'jne', 'shipping_service' => 'REG',
        ])->assertSessionHasNoErrors();

        $order = $request->fresh()->order;
        $this->assertNotNull($order);
        $this->assertSame(25000, $order->shipping_amount);
        $this->assertSame(['courier' => 'jne', 'service' => 'REG', 'amount' => 25000, 'etd' => '2-3 day'], $order->shipping_snapshot);
        $this->assertSame(26000, $order->total);
    }

    public function test_non_jne_courier_in_catatan_still_requires_admin_jne_service(): void
    {
        [$request, $actor] = $this->readyFixture(courier: 'JNT');
        // Admin harus tetap mengirim kurir JNE + layanan live; nominal dihitung ulang server.
        $this->actingAs($actor)->patch(route('rtpu.verify.layanan.approve', $request->id), [
            'shipping_courier' => 'jne', 'shipping_service' => 'REG',
        ])->assertSessionHasNoErrors();
        $this->assertSame(25000, $request->fresh()->order->shipping_amount);
    }

    public function test_provider_failure_blocks_approval(): void
    {
        [$request, $actor] = $this->readyFixture();
        config(['services.rajaongkir.key' => '']);
        $this->actingAs($actor)->patch(route('rtpu.verify.layanan.approve', $request->id), [])
            ->assertSessionHasErrors('shipping_service');
        $this->assertSame('Diajukan', $request->fresh()->status);
        $this->assertNull($request->fresh()->order);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Services\InvoiceService;
use App\Services\ShippingService;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class ShippingAndStockRegressionTest extends SqlitePreorderBluInvoiceTest
{
    private function fixture(string $method = 'Diantar'): array
    {
        return (new \ReflectionMethod(PreorderBluInvoiceTest::class, 'requestFixture'))->invoke($this, $method);
    }

    public function test_shipping_amount_is_requoted_and_browser_amount_ignored(): void
    {
        [$request, $actor, , , , $data] = $this->fixture();
        $invoice = app(InvoiceService::class)->preparePreorder($request, $actor, [...$data, 'shipping_amount' => 1]);
        $this->assertSame(25000, $invoice->shipping_amount);
        Http::assertSent(fn ($http) => $http['weight'] === 1000 && $http['destination'] === '152' && $http['courier'] === 'jne');
    }

    public function test_pickup_ignores_shipping_and_never_calls_provider(): void
    {
        [$request, $actor, , , , $data] = $this->fixture('Ambil di PNJ');
        $invoice = app(InvoiceService::class)->preparePreorder($request, $actor, $data);
        $this->assertSame(0, $invoice->shipping_amount);
        Http::assertNothingSent();
    }

    public function test_missing_key_does_not_return_mock_rates(): void
    {
        config(['services.rajaongkir.key' => '']);
        Http::preventStrayRequests();
        $this->expectException(ValidationException::class);
        app(ShippingService::class)->calculateCost('152', 1000, 'jne');
    }

    public function test_unsupported_courier_does_not_call_provider(): void
    {
        config(['services.rajaongkir.key' => 'test-only', 'services.rajaongkir.type' => 'starter']);
        Http::preventStrayRequests();
        $this->expectException(ValidationException::class);
        app(ShippingService::class)->calculateCost('152', 1000, 'jnt');
    }

    public function test_missing_destination_blocks_delivery_invoice(): void
    {
        [$request, $actor, , , , $data] = $this->fixture();
        $request->update(['catatan' => 'Alamat tanpa kota']);
        $this->expectException(ValidationException::class);
        app(InvoiceService::class)->preparePreorder($request, $actor, $data);
    }

    public function test_stock_counts_only_paid_sales_without_mutating_supply_and_preorders_are_exempt(): void
    {
        [$request] = $this->fixture();
        $product = $request->product;
        $product->update(['stock' => 10, 'meta' => ['availability_status' => 'tersedia']]);
        foreach (['Lunas', 'Diproses', 'Selesai', 'Dibatalkan', 'Menunggu Pembayaran'] as $status) {
            $sale = $request->replicate();
            $sale->code = 'STOCK-'.bin2hex(random_bytes(6));
            $sale->status = $status;
            $sale->jumlah = '2';
            $sale->save();
        }
        $this->assertSame(4, $product->availableStock());
        $this->assertSame(10, $product->fresh()->stock);
        $product->assertAvailableQuantity('4');
        try {
            $product->assertAvailableQuantity('5');
            $this->fail('Must reject excess ready-stock quantity');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('jumlah', $exception->errors());
        }
        $product->update(['stock' => 0, 'meta' => ['availability_status' => 'preorder']]);
        $product->assertAvailableQuantity('100');
    }

    public function test_pengajuan_review_includes_owner_identity_and_product_price(): void
    {
        [$request, $actor, , $owner] = $this->fixture();
        $this->actingAs($actor)->get(route('rtpu.verify.layanan.show', $request->id))
            ->assertOk()->assertInertia(fn ($page) => $page
                ->where('selected.owner_detail.name', $owner->name)
                ->where('selected.product_detail.final_price', 500));
    }
}

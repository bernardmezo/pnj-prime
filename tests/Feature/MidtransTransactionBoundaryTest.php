<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Services\MidtransService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class MidtransTransactionBoundaryTest extends TestCase
{
    use RefreshDatabase;

    public function test_snap_creation_fails_closed_inside_an_existing_transaction(): void
    {
        $buyer = User::factory()->create(['role' => 'customer']);
        $category = ProductCategory::create(['name' => 'Test', 'slug' => 'boundary-test']);
        $product = Product::create(['category_id' => $category->id, 'owner_id' => $buyer->id, 'name' => 'Test', 'slug' => 'boundary-test', 'base_price' => 10000, 'final_price' => 10000, 'is_active' => true, 'curation_status' => 'approved']);
        $request = Pengajuan::create(['code' => 'BOUNDARY-1', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'produk', 'total' => 10000, 'status' => 'Menunggu Pembayaran']);
        $request->order()->create(['order_number' => 'BOUNDARY-1', 'buyer_id' => $buyer->id, 'subtotal' => 10000, 'tax_amount' => 0, 'total' => 10000, 'status' => 'menunggu_pembayaran']);
        Http::fake(['*' => Http::response(['token' => 'test-token'], 201)]);

        try {
            DB::transaction(fn () => app(MidtransService::class)->createSnapPayment($request));
            $this->fail('A nested transaction cannot commit a durable reservation before HTTP.');
        } catch (\LogicException $e) {
            $this->assertStringContainsString('transaction', $e->getMessage());
        }
        Http::assertNothingSent();
        $this->assertSame(0, $request->payments()->count());
    }
}

<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class ShipmentReceiptTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed permission customer untuk pengajuan agar middleware EnsurePermission lolos
        DB::table('permissions')->insert([
            ['role' => 'customer', 'fitur_key' => 'pengajuan', 'aksi' => 'Lihat',   'allowed' => 1],
            ['role' => 'customer', 'fitur_key' => 'pengajuan', 'aksi' => 'Tambah',  'allowed' => 1],
            ['role' => 'customer', 'fitur_key' => 'pengajuan', 'aksi' => 'Ubah',    'allowed' => 1],
            ['role' => 'customer', 'fitur_key' => 'pengajuan', 'aksi' => 'Hapus',   'allowed' => 1],
        ]);
        User::flushPermissionCache();
    }

    private function shipment(array $overrides = []): array
    {
        $buyer = User::factory()->customer()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $category = ProductCategory::create(['name' => 'TEST', 'slug' => uniqid('test'), 'is_active' => true]);
        $product = Product::create(['category_id' => $category->id, 'owner_id' => $owner->id, 'name' => 'TEST', 'slug' => uniqid('test'), 'base_price' => 100, 'final_price' => 100]);
        $p = Pengajuan::create([
            'code' => uniqid('TEST'),
            'buyer_id' => $buyer->id,
            'product_id' => $product->id,
            'tipe' => 'produk',
            'status' => 'Dikirim',
            'metode_pengambilan' => 'Diantar',
            'courier_name' => 'JNE',
            'tracking_number' => 'JNE-001',
            'shipped_at' => now(),
            ...$overrides,
        ]);

        return [$p, $owner, $buyer];
    }

    public function test_buyer_can_confirm_receipt_of_own_shipped_order(): void
    {
        [$p, $owner, $buyer] = $this->shipment();
        Order::create(['pengajuan_id' => $p->id, 'order_number' => 'ORD-TEST-'.$p->id, 'buyer_id' => $buyer->id, 'subtotal' => 100, 'tax_amount' => 0, 'total' => 100, 'status' => 'diproses']);

        $resp = $this->actingAs($buyer)
            ->patch(route('customer.pengajuan.confirm-receipt', $p));
        $resp->assertRedirect();
        $resp->assertSessionHasNoErrors();

        $p->refresh();
        $this->assertSame('Selesai', $p->status);
        $this->assertSame('selesai', $p->order->status);
        $this->assertNotNull($p->order->completed_at);
        $this->assertSame('Pesanan dikonfirmasi telah diterima oleh customer.', $p->history[array_key_last($p->history)]['note']);
    }

    public function test_another_customer_cannot_confirm_someone_elses_order(): void
    {
        [$p] = $this->shipment();
        $other = User::factory()->customer()->create();

        $this->actingAs($other)->patch(route('customer.pengajuan.confirm-receipt', $p))->assertForbidden();
        $this->assertSame('Dikirim', $p->fresh()->status);
    }

    public function test_receipt_requires_shipped_status(): void
    {
        [$p, $owner, $buyer] = $this->shipment(['status' => 'Diproses']);

        $this->actingAs($buyer)->patch(route('customer.pengajuan.confirm-receipt', $p))->assertForbidden();
        $this->assertSame('Diproses', $p->fresh()->status);
    }

    public function test_pickup_orders_cannot_use_shipment_receipt(): void
    {
        [$p, $owner, $buyer] = $this->shipment(['metode_pengambilan' => 'Ambil di PNJ']);

        $this->actingAs($buyer)->patch(route('customer.pengajuan.confirm-receipt', $p))->assertForbidden();
        $this->assertSame('Dikirim', $p->fresh()->status);
    }

    public function test_completed_order_cannot_be_confirmed_again(): void
    {
        [$p, $owner, $buyer] = $this->shipment(['status' => 'Selesai']);

        $this->actingAs($buyer)->patch(route('customer.pengajuan.confirm-receipt', $p))->assertForbidden();
        $this->assertSame('Selesai', $p->fresh()->status);
    }
}

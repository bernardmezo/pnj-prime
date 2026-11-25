<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Notifications\PickupReady;
use App\Notifications\OrderShipped;
use App\Services\PengajuanWorkflow;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReadyStockFulfillmentFlowTest extends TestCase
{
    use RefreshDatabase;

    private function fixture(string $tipe, string $metode, string $status = 'Lunas'): array
    {
        $this->seed(\Database\Seeders\UsecaseSeeder::class);
        User::flushPermissionCache();
        $buyer = User::factory()->customer()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $category = ProductCategory::create(['name' => 'Test', 'slug' => 'test-'.bin2hex(random_bytes(6)), 'is_active' => true]);
        $product = Product::create(['category_id' => $category->id, 'owner_id' => $owner->id,
            'name' => 'Produk test', 'slug' => 'test-'.bin2hex(random_bytes(6)),
            'base_price' => 500, 'final_price' => 500, 'meta' => ['availability_status' => 'tersedia']]);
        $pengajuan = Pengajuan::create([
            'code' => 'TEST-'.bin2hex(random_bytes(6)), 'buyer_id' => $buyer->id,
            'product_id' => $product->id, 'tipe' => $tipe, 'jumlah' => 1, 'total' => 500,
            'metode_pengambilan' => $metode, 'status' => $status,
        ]);
        return [$pengajuan, $owner, $buyer];
    }

    public function test_pickup_full_flow(): void
    {
        Storage::fake('local');
        Notification::fake();
        [$p, $owner, $buyer] = $this->fixture('produk', 'Ambil di lokasi');

        // Step 1: owner tandai siap diambil (Lunas -> Diproses + pickup_ready_at)
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p->id), [
            'status' => 'Diproses', 'pickup_action' => 'ready',
        ])->assertSessionHasNoErrors();

        $p->refresh();
        $this->assertSame('Diproses', $p->status);
        $this->assertNotNull($p->pickup_ready_at);
        Notification::assertSentTo($buyer, PickupReady::class);

        // Step 2: owner selesaikan dengan identitas + foto
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p->id), [
            'status' => 'Selesai',
            'collector_name' => 'Budi',
            'collector_contact' => '08123',
            'handover_photo' => UploadedFile::fake()->image('foto.jpg'),
        ])->assertSessionHasNoErrors();

        $p->refresh();
        $this->assertSame('Selesai', $p->status);
        $this->assertNotNull($p->handed_over_at);
    }

    public function test_shipment_full_flow(): void
    {
        Notification::fake();
        [$p, $owner, $buyer] = $this->fixture('produk', 'Diantar');

        // Step 1: Lunas -> Diproses
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p->id), [
            'status' => 'Diproses',
        ])->assertSessionHasNoErrors();
        $this->assertSame('Diproses', $p->fresh()->status);

        // Step 2: Diproses -> Dikirim
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p->id), [
            'status' => 'Dikirim', 'courier_name' => 'JNE', 'tracking_number' => 'RESI-123',
        ])->assertSessionHasNoErrors();
        $this->assertSame('Dikirim', $p->fresh()->status);
        Notification::assertSentTo($buyer, OrderShipped::class);
    }

    public function test_jasa_full_flow_to_hasil_diunggah(): void
    {
        Storage::fake('local');
        Notification::fake();
        [$p, $owner, $buyer] = $this->fixture('jasa', '');

        // Step 1: Lunas -> Diproses
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p->id), [
            'status' => 'Diproses',
        ])->assertSessionHasNoErrors();
        $this->assertSame('Diproses', $p->fresh()->status);

        // Step 2: Diproses -> Dijadwalkan
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p->id), [
            'status' => 'Dijadwalkan',
            'jadwal_mulai' => '2026-11-25T08:00',
            'jadwal_selesai' => '2026-11-27T16:00',
        ])->assertSessionHasNoErrors();
        $this->assertSame('Dijadwalkan', $p->fresh()->status);

        // Step 3: Dijadwalkan -> Dikerjakan
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p->id), [
            'status' => 'Dikerjakan',
        ])->assertSessionHasNoErrors();
        $this->assertSame('Dikerjakan', $p->fresh()->status);

        // Step 4: Dikerjakan -> Hasil Diunggah
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p->id), [
            'status' => 'Hasil Diunggah',
            'hasil_files' => [UploadedFile::fake()->create('hasil.pdf', 500, 'application/pdf')],
        ])->assertSessionHasNoErrors();
        $this->assertSame('Hasil Diunggah', $p->fresh()->status);
    }

    public function test_customer_can_finish_rate_and_revise_jasa_with_access_control(): void
    {
        Storage::fake('local');
        [$p, $owner, $buyer] = $this->fixture('jasa', '');
        $rtpu = User::factory()->adminRtpu()->create();
        $other = User::factory()->customer()->create();
        $p->update([
            'status' => 'Hasil Diunggah', 'revision_count' => 0,
            'hasil_files' => [['path' => 'hasil-jasa/test/hasil.pdf', 'name' => 'hasil.pdf', 'size' => 100, 'round' => 0]],
        ]);
        Storage::disk('local')->put('hasil-jasa/test/hasil.pdf', 'hasil');

        $this->actingAs($buyer)->get(route('hasil-jasa.download', [$p->id, 0]))->assertOk();
        $this->actingAs($rtpu)->get(route('hasil-jasa.download', [$p->id, 0]))->assertOk();
        $this->actingAs($other)->get(route('hasil-jasa.download', [$p->id, 0]))->assertForbidden();

        $this->actingAs($buyer)->patch(route('customer.pengajuan.jasa.revision', $p->id), ['catatan' => 'Perlu revisi bagian hasil.'])->assertSessionHasNoErrors();
        $this->assertSame('Dikerjakan', $p->fresh()->status);
        $this->assertSame(1, $p->fresh()->revision_count);

        $p->update(['status' => 'Hasil Diunggah', 'revision_count' => 2]);
        $this->actingAs($buyer)->patch(route('customer.pengajuan.jasa.revision', $p->fresh()->id), ['catatan' => 'Revisi ketiga ditolak.'])->assertForbidden();
        $this->assertSame(2, $p->fresh()->revision_count);
    }

    public function test_owner_can_upload_revised_result(): void
    {
        Storage::fake('local');
        [$p, $owner, $buyer] = $this->fixture('jasa', '', 'Dikerjakan');
        $p->update(['revision_count' => 1]);
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p->id), [
            'status' => 'Hasil Diunggah',
            'hasil_files' => [UploadedFile::fake()->create('revisi.pdf', 500, 'application/pdf')],
        ])->assertSessionHasNoErrors();
        $p->refresh();
        $this->assertSame('Hasil Diunggah', $p->status);
        $this->assertSame(1, $p->hasil_files[0]['round']);
    }

    public function test_customer_can_finish_and_rate_uploaded_jasa_once(): void
    {
        [$p, $owner, $buyer] = $this->fixture('jasa', '', 'Hasil Diunggah');
        $this->actingAs($buyer)->patch(route('customer.pengajuan.jasa.confirm', $p->id))->assertSessionHasNoErrors();
        $this->assertSame('Selesai', $p->fresh()->status);
        $this->actingAs($buyer)->post(route('customer.pengajuan.jasa.rate', $p->id), ['rating' => 5, 'ulasan' => 'Bagus'])->assertSessionHasNoErrors();
        $this->assertSame(5, $p->fresh()->rating);
        $this->actingAs($buyer)->post(route('customer.pengajuan.jasa.rate', $p->id), ['rating' => 1])->assertForbidden();
    }

    public function test_customer_can_confirm_shipment_receipt(): void
    {
        [$p, $owner, $buyer] = $this->fixture('produk', 'Diantar', 'Dikirim');
        $this->actingAs($buyer)->patch(route('customer.pengajuan.confirm-receipt', $p->id))->assertSessionHasNoErrors();
        $this->assertSame('Selesai', $p->fresh()->status);
    }

    public function test_rtpu_can_reject_pending_manual_payment_proof(): void
    {
        [$p, $owner, $buyer] = $this->fixture('produk', 'Diantar', 'Menunggu Verifikasi Pembayaran');
        $order = $p->order()->create([
            'order_number' => 'TEST-'.bin2hex(random_bytes(4)), 'buyer_id' => $buyer->id,
            'pengajuan_id' => $p->id, 'subtotal' => 500, 'tax_amount' => 0, 'total' => 500,
            'status' => 'menunggu_pembayaran',
        ]);
        $proof = $order->paymentProofs()->create([
            'file_path' => 'bukti/test.pdf', 'file_name' => 'test.pdf', 'mime_type' => 'application/pdf', 'verification_status' => 'pending',
        ]);
        $rtpu = User::factory()->adminRtpu()->create();
        $this->actingAs($rtpu)->patch(route('rtpu.verify.bayar.reject', $proof->id), ['catatan' => 'Bukti tidak terbaca.'])->assertSessionHasNoErrors();
        $this->assertSame('rejected', $proof->fresh()->verification_status);
        $this->assertSame('Menunggu Pembayaran', $p->fresh()->status);
    }

    public function test_ready_stock_receipt_includes_locked_shipping_amount(): void
    {
        [$p, $owner, $buyer] = $this->fixture('produk', 'Diantar', 'Diproses');
        $order = $p->order()->create([
            'order_number' => 'TEST-'.bin2hex(random_bytes(4)), 'buyer_id' => $buyer->id,
            'pengajuan_id' => $p->id, 'subtotal' => 500, 'tax_amount' => 50,
            'shipping_amount' => 25000, 'shipping_snapshot' => ['courier' => 'jne', 'service' => 'REG', 'amount' => 25000],
            'total' => 25550, 'status' => 'dibayar', 'paid_at' => now(),
        ]);

        $invoice = app(\App\Services\InvoiceService::class)->issueReceiptForReadyStock($p->fresh());

        $this->assertNotNull($invoice);
        $this->assertSame(500, $invoice->subtotal);
        $this->assertSame(50, $invoice->tax_amount);
        $this->assertSame(25000, $invoice->shipping_amount);
        $this->assertSame(25550, $invoice->total);
    }

}

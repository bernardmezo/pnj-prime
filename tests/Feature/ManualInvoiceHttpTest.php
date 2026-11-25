<?php

namespace Tests\Feature;

use App\Models\MetodePembayaran;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Notifications\ProductPaymentReceived;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ManualInvoiceHttpTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        Notification::fake();
        Storage::fake('local');
    }

    private function fixture(string $type = 'jasa'): array
    {
        $buyer = User::factory()->customer()->create();
        $staff = User::factory()->adminRtpu()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $category = ProductCategory::create(['name' => 'Fixture', 'slug' => 'fixture', 'is_active' => true]);
        $product = Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Test item', 'slug' => 'test-item', 'base_price' => 900, 'final_price' => 900, 'is_active' => true, 'curation_status' => 'approved']);
        $request = Pengajuan::create(['code' => 'HTTP-TEST', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => $type, 'status' => 'Diajukan', 'jumlah' => 2, 'total' => 250]);
        $bank = MetodePembayaran::create(['nama' => 'Test BLU', 'tipe' => 'BLU', 'rekening' => 'TEST', 'holder' => 'TEST', 'aktif' => true]);
        $data = ['bank_id' => $bank->id, 'due_date' => now()->addDays(3)->toDateString(), 'tax_rate' => '10'];

        return [$request, $buyer, $staff, $owner, $bank, $data];
    }

    public function test_jasa_http_approval_rejection_and_verification(): void
    {
        [$request, $buyer, $staff, $owner, $bank, $data] = $this->fixture();
        $this->actingAs($staff)->patch(route('rtpu.verify.layanan.approve', $request->id), $data + ['tarif_jasa' => 200])->assertRedirect(route('rtpu.verify.layanan'))->assertSessionHasNoErrors();
        $request->refresh();
        $invoice = $request->invoices()->firstOrFail();
        $this->assertSame('Menunggu Pembayaran', $request->status);
        $this->assertSame('issued', $invoice->status);
        $this->assertSame(440, (int) $request->order->total);
        $this->actingAs($buyer)->post(route('customer.pengajuan.proof', $request), ['metode_id' => $bank->id, 'bukti' => UploadedFile::fake()->image('proof.jpg')])->assertRedirect()->assertSessionHasNoErrors();
        $proof = $request->fresh()->order->paymentProofs()->firstOrFail();
        $this->actingAs($staff)->patch(route('rtpu.verify.bayar.reject', $proof), ['catatan' => 'Tidak jelas'])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('rejected', $proof->fresh()->verification_status);
        $this->assertSame('Menunggu Pembayaran', $request->fresh()->status);
        $this->assertSame('issued', $invoice->fresh()->status);
        $this->assertSame(1, $request->orders()->count());
        $this->actingAs($buyer)->post(route('customer.pengajuan.proof', $request), ['metode_id' => $bank->id, 'bukti' => UploadedFile::fake()->image('retry.jpg')])->assertRedirect()->assertSessionHasNoErrors();
        $proof = $request->fresh()->order->paymentProofs()->latest('id')->firstOrFail();
        $this->actingAs($staff)->patch(route('rtpu.verify.bayar.accept', $proof))->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('verified', $proof->fresh()->verification_status);
        $this->assertSame('Lunas', $request->fresh()->status);
        $this->assertSame('paid', $invoice->fresh()->status);
        Notification::assertSentTo($owner, ProductPaymentReceived::class);
    }

    public function test_unauthorized_user_cannot_approve_or_verify_or_upload_someone_elses_proof(): void
    {
        [$request, $buyer, $staff, , $bank, $data] = $this->fixture();
        $other = User::factory()->customer()->create();
        $this->actingAs($other)->patch(route('rtpu.verify.layanan.approve', $request->id), $data)->assertForbidden();
        $this->assertSame('Diajukan', $request->fresh()->status);
        $this->actingAs($staff)->patch(route('rtpu.verify.layanan.approve', $request->id), $data)->assertSessionHasNoErrors();
        $this->actingAs($other)->post(route('customer.pengajuan.proof', $request), ['metode_id' => $bank->id, 'bukti' => UploadedFile::fake()->image('proof.jpg')])->assertForbidden();
        $this->actingAs($buyer)->post(route('customer.pengajuan.proof', $request), ['metode_id' => $bank->id, 'bukti' => UploadedFile::fake()->image('proof.jpg')])->assertSessionHasNoErrors();
        $proof = $request->fresh()->order->paymentProofs()->firstOrFail();
        $this->actingAs($other)->patch(route('rtpu.verify.bayar.accept', $proof))->assertForbidden();
        $this->actingAs($other)->patch(route('rtpu.verify.bayar.reject', $proof), ['catatan' => 'invalid'])->assertForbidden();
        $this->assertSame('pending', $proof->fresh()->verification_status);
        $this->assertSame('Menunggu Verifikasi Pembayaran', $request->fresh()->status);
    }

    public function test_rental_http_approval_preserves_submitted_amount(): void
    {
        [$request, , $staff, , , $data] = $this->fixture('ruangan');
        $this->actingAs($staff)->patch(route('rtpu.verify.layanan.approve', $request->id), $data)->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Menunggu Pembayaran', $request->fresh()->status);
        $this->assertSame(275, (int) $request->fresh()->order->total);
    }

    public function test_jasa_http_rejection_requires_a_reason(): void
    {
        [$request, $buyer, $staff, , $bank, $data] = $this->fixture();
        $this->actingAs($staff)->patch(route('rtpu.verify.layanan.approve', $request->id), $data)->assertSessionHasNoErrors();
        $this->actingAs($buyer)->post(route('customer.pengajuan.proof', $request), ['metode_id' => $bank->id, 'bukti' => UploadedFile::fake()->image('proof.jpg')])->assertSessionHasNoErrors();
        $proof = $request->fresh()->order->paymentProofs()->firstOrFail();
        $this->from(route('rtpu.verify.bayar'))->actingAs($staff)->patch(route('rtpu.verify.bayar.reject', $proof), ['catatan' => ''])->assertSessionHasErrors('catatan');
        $this->assertSame('pending', $proof->fresh()->verification_status);
        $this->assertSame('Menunggu Verifikasi Pembayaran', $request->fresh()->status);
    }

    public function test_preorder_http_approval_rejection_and_verification(): void
    {
        \Illuminate\Support\Facades\Http::preventStrayRequests();
        \Illuminate\Support\Facades\Http::fake(['*/calculate/domestic-cost' => \Illuminate\Support\Facades\Http::response(['data' => [['service' => 'REG', 'description' => 'Layanan Reguler', 'cost' => 25000, 'etd' => '2-3 day']]])]);
        config(['services.rajaongkir.key' => 'test-only']);
        [$request, $buyer, $staff, $owner, $bank] = $this->fixture('produk');
        $request->product()->update(['meta' => ['availability_status' => 'preorder', 'weight' => 500]]);
        $request->update(['total' => 1000, 'metode_pengambilan' => 'Ambil di PNJ']);
        $data = ['bank_id' => $bank->id, 'due_date' => now()->addDays(3)->toDateString(), 'tax_rate' => '10', 'unit_price' => 105];
        $this->actingAs($staff)->patch(route('rtpu.verify.layanan.approve', $request->id), $data)->assertSessionHasErrors('invoice');
        $this->actingAs($staff)->post(route('rtpu.invoice.store', $request), $data)->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('draft', $request->fresh()->invoices()->firstOrFail()->status);
        $this->actingAs($staff)->patch(route('rtpu.verify.layanan.approve', $request->id))->assertSessionHasNoErrors();
        $this->assertSame('Menunggu Pembayaran', $request->fresh()->status);
        $this->actingAs($buyer)->post(route('customer.pengajuan.proof', $request), ['metode_id' => $bank->id, 'bukti' => UploadedFile::fake()->image('proof.jpg')])->assertSessionHasNoErrors();
        $proof = $request->fresh()->order->paymentProofs()->firstOrFail();
        $this->actingAs($staff)->patch(route('rtpu.verify.bayar.reject', $proof), ['catatan' => 'Bukti salah'])->assertSessionHasNoErrors();
        $this->assertSame('rejected', $proof->fresh()->verification_status);
        $this->assertSame('Menunggu Pembayaran', $request->fresh()->status);
        $this->assertSame(1, $request->orders()->count());
        $this->actingAs($buyer)->post(route('customer.pengajuan.proof', $request), ['metode_id' => $bank->id, 'bukti' => UploadedFile::fake()->image('retry.jpg')])->assertSessionHasNoErrors();
        $proof = $request->fresh()->order->paymentProofs()->latest('id')->firstOrFail();
        $this->actingAs($staff)->patch(route('rtpu.verify.bayar.accept', $proof))->assertSessionHasNoErrors();
        $this->assertSame('Lunas', $request->fresh()->status);
        $this->assertSame('paid', $request->fresh()->invoices()->firstOrFail()->status);
        Notification::assertSentTo($owner, ProductPaymentReceived::class);
    }
}

<?php

namespace Tests\Feature;

use App\Models\MetodePembayaran;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Notifications\ProductPaymentReceived;
use App\Services\InvoiceService;
use App\Services\ManualPreorderPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class JasaManualInvoiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_jasa_invoice_and_verified_proof_preserve_submitted_amount(): void
    {
        Notification::fake();
        Storage::fake('local');
        $buyer = User::factory()->customer()->create();
        $issuer = User::factory()->adminRtpu()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $category = ProductCategory::create(['name' => 'Jasa', 'slug' => 'jasa-test', 'is_active' => true]);
        $product = Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Jasa uji', 'slug' => 'jasa-uji', 'base_price' => 900, 'final_price' => 900, 'is_active' => true, 'curation_status' => 'approved']);
        $request = Pengajuan::create(['code' => 'TEST-JASA', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'jasa', 'status' => 'Menunggu Invoice', 'jumlah' => 1, 'total' => 250]);
        $bank = MetodePembayaran::create(['nama' => 'TEST BLU', 'tipe' => 'BLU', 'rekening' => 'TEST', 'holder' => 'TEST', 'aktif' => true]);
        $service = app(InvoiceService::class);
        $invoice = $service->prepareRental($request, $issuer, ['bank_id' => $bank->id, 'due_date' => now()->addDays(3)->toDateString(), 'tax_rate' => '10']);
        $service->approveRental($request, $issuer);
        $this->assertSame(275, (int) $request->fresh()->order->total);
        app(ManualPreorderPayment::class)->upload($request, $buyer, $bank->id, UploadedFile::fake()->image('proof.jpg'));
        $proof = $request->fresh()->order->paymentProofs()->firstOrFail();
        app(ManualPreorderPayment::class)->verify($proof, $issuer);
        $this->assertSame('Lunas', $request->fresh()->status);
        $this->assertSame('paid', $invoice->fresh()->status);
        Notification::assertSentTo($owner, ProductPaymentReceived::class);
    }
}

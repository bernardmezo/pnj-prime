<?php

namespace Tests\Feature;

use App\Models\MetodePembayaran;
use App\Models\PaymentProof;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Notifications\ProductPaymentReceived;
use App\Services\InvoiceService;
use App\Services\ManualPreorderPayment;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/** Uses an isolated SQLite memory database or a separately migrated test database. */
class PreorderBluInvoiceTest extends TestCase
{
    use DatabaseTransactions;

    public function createApplication()
    {
        $app = parent::createApplication();
        $connection = $app['config']->get('database.default');
        $config = $app['config']->get("database.connections.{$connection}", []);

        if (($config['driver'] ?? null) === 'sqlite' && ($config['database'] ?? null) === ':memory:' && empty($config['url'])) {
            \Illuminate\Support\Facades\Artisan::call('migrate', ['--database' => $connection, '--force' => true]);
        }

        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\UsecaseSeeder::class);
        User::flushPermissionCache();
    }

    private function requestFixture(string $fulfillment = 'Diantar'): array
    {
        $buyer = User::factory()->customer()->create();
        $actor = User::factory()->adminRtpu()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $category = ProductCategory::create(['name' => 'Test only', 'slug' => 'test-'.bin2hex(random_bytes(6)), 'is_active' => true]);
        $product = Product::create(['category_id' => $category->id, 'owner_id' => $owner->id,
            'name' => 'Produk pengujian', 'slug' => 'test-'.bin2hex(random_bytes(6)),
            'base_price' => 500, 'final_price' => 500, 'meta' => ['availability_status' => 'preorder', 'weight' => 500]]);
        $request = Pengajuan::create(['code' => 'TEST-'.bin2hex(random_bytes(6)), 'buyer_id' => $buyer->id,
            'product_id' => $product->id, 'tipe' => 'produk', 'jumlah' => 2, 'total' => 1000,
            'metode_pengambilan' => $fulfillment, 'catatan' => 'Alamat: TEST | Kota: 25979 | Kurir: JNE | Layanan: REG | Ongkir: Rp 25.000', 'status' => 'Diajukan']);
        // Explicit test fixture only; not a production bank or seeded configuration.
        $bank = MetodePembayaran::create(['nama' => 'TEST ONLY BLU', 'tipe' => 'BLU', 'rekening' => 'TEST-ACCOUNT', 'holder' => 'TEST ONLY', 'aktif' => true]);
        // Explicit provider test double; never used by production.
        config(['services.rajaongkir.key' => 'test-only', 'services.rajaongkir.type' => 'starter']);
        \Illuminate\Support\Facades\Http::preventStrayRequests();
        \Illuminate\Support\Facades\Http::fake(['*/calculate/domestic-cost' => \Illuminate\Support\Facades\Http::response(['data' => [['service' => 'REG', 'description' => 'Layanan Reguler', 'cost' => 25000, 'etd' => '2-3 day']]])]);
        $data = ['shipping_courier' => 'jne', 'shipping_service' => 'REG', 'unit_price' => 105, 'shipping_amount' => 25000, 'tax_rate' => '10.00',
            'bank_id' => $bank->id, 'due_date' => now()->addDays(3)->toDateString()];

        return [$request, $actor, $buyer, $owner, $bank, $data];
    }

    public function test_customer_cannot_change_request_after_draft(): void
    {
        [$request, $actor, $buyer, , , $data] = $this->requestFixture();
        app(InvoiceService::class)->preparePreorder($request, $actor, $data);
        $this->actingAs($buyer)->patch(route('customer.pengajuan.update', $request), ['jumlah' => '9'])
            ->assertSessionHasErrors('invoice');
        $this->assertSame('2', (string) $request->fresh()->jumlah);
    }

    public function test_rejection_releases_draft_total(): void
    {
        [$request, $actor, , , , $data] = $this->requestFixture();
        $invoice = app(InvoiceService::class)->preparePreorder($request, $actor, $data);
        app(\App\Services\PengajuanWorkflow::class)->transition($request, 'Ditolak', 'Ditolak pengujian');
        $this->assertSame('cancelled', $invoice->fresh()->status);
        [$other, $otherActor, , , , $otherData] = $this->requestFixture();
        $replacement = app(InvoiceService::class)->preparePreorder($other, $otherActor, $otherData);
        $this->assertSame($invoice->total, $replacement->total);
    }

    public function test_customer_cancellation_cancels_draft(): void
    {
        [$request, $actor, $buyer, , , $data] = $this->requestFixture();
        $invoice = app(InvoiceService::class)->preparePreorder($request, $actor, $data);
        $this->actingAs($buyer)->patch(route('customer.pengajuan.cancel', $request))->assertRedirect();
        $this->assertSame('cancelled', $invoice->fresh()->status);
    }

    public function test_monitoring_cannot_cancel_draft_but_customer_can_release_it(): void
    {
        [$request, $actor, $buyer, , , $data] = $this->requestFixture();
        $invoice = app(InvoiceService::class)->preparePreorder($request, $actor, $data);
        $this->actingAs($actor)->patch(route('rtpu.status.update', $request), ['status' => 'Dibatalkan'])->assertForbidden();
        $this->assertSame('draft', $invoice->fresh()->status);
        $this->assertSame('Diajukan', $request->fresh()->status);

        $this->actingAs($buyer)->patch(route('customer.pengajuan.cancel', $request))->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('cancelled', $invoice->fresh()->status);
        $this->assertSame('Dibatalkan', $request->fresh()->status);
        [$other, $otherActor, , , , $otherData] = $this->requestFixture();
        $replacement = app(InvoiceService::class)->preparePreorder($other, $otherActor, $otherData);
        $this->assertSame($invoice->total, $replacement->total);
    }

    public function test_cancelling_issued_request_releases_total(): void
    {
        Notification::fake();
        [$request, $actor, $buyer, , , $data] = $this->requestFixture();
        $invoice = app(InvoiceService::class)->preparePreorder($request, $actor, $data);
        app(InvoiceService::class)->approvePreorder($request, $actor);
        $this->actingAs($buyer)->patch(route('customer.pengajuan.cancel', $request))->assertRedirect();
        $this->assertSame('cancelled', $invoice->fresh()->status);
        $this->assertSame('dibatalkan', $request->fresh()->order->status);
    }

    public function test_stale_request_cannot_issue_draft(): void
    {
        [$request, $actor, , , , $data] = $this->requestFixture();
        app(InvoiceService::class)->preparePreorder($request, $actor, $data);
        Pengajuan::whereKey($request->id)->update(['metode_pengambilan' => 'Ambil di PNJ']);
        $this->expectException(ValidationException::class);
        app(InvoiceService::class)->approvePreorder($request, $actor);
    }

    public function test_draft_precedes_approval_and_invoice_order_totals_match(): void
    {
        [$request, $actor, , , $bank, $data] = $this->requestFixture();
        $service = app(InvoiceService::class);
        $invoice = $service->preparePreorder($request, $actor, $data);
        $this->assertSame('Diajukan', $request->fresh()->status);
        $this->assertSame('draft', $invoice->status);
        $this->assertSame(21, $invoice->tax_amount);
        $bank->update(['rekening' => 'CHANGED']);
        $this->assertSame('TEST-ACCOUNT', $invoice->fresh()->bank_snapshot['account']);
        $service->approvePreorder($request, $actor);
        $invoice->refresh();
        $this->assertSame('issued', $invoice->status);
        $this->assertSame($invoice->total, $request->fresh()->order->total);
        $this->assertSame($invoice->total, (int) $request->fresh()->total);
    }

    public function test_pickup_is_zero_shipping_and_active_transfer_totals_differ(): void
    {
        [$request, $actor, , , , $data] = $this->requestFixture('Ambil di PNJ');
        [$other, $otherActor, , , , $otherData] = $this->requestFixture('Ambil di PNJ');
        $first = app(InvoiceService::class)->preparePreorder($request, $actor, $data);
        $second = app(InvoiceService::class)->preparePreorder($other, $otherActor, $otherData);
        $this->assertSame(0, $first->shipping_amount);
        $this->assertNotSame($first->total, $second->total);
    }

    public function test_preorder_approval_without_prepared_invoice_fails(): void
    {
        [$request, $actor] = $this->requestFixture();
        $this->expectException(ValidationException::class);
        app(InvoiceService::class)->approvePreorder($request, $actor);
    }

    public function test_non_blu_bank_cannot_prepare_invoice(): void
    {
        [$request, $actor, , , $bank, $data] = $this->requestFixture();
        $bank->update(['tipe' => 'Transfer Bank']);
        $this->expectException(ValidationException::class);
        app(InvoiceService::class)->preparePreorder($request, $actor, $data);
    }

    public function test_proof_is_bank_bound_and_manual_verification_notifies_owner(): void
    {
        Storage::fake('local');
        Notification::fake();
        [$request, $actor, $buyer, $owner, $bank, $data] = $this->requestFixture();
        $invoice = app(InvoiceService::class)->preparePreorder($request, $actor, $data);
        app(InvoiceService::class)->approvePreorder($request, $actor);
        $service = app(ManualPreorderPayment::class);
        try {
            $service->upload($request, $buyer, $bank->id + 99999, UploadedFile::fake()->image('proof.jpg'));
            $this->fail('Wrong bank must be rejected');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('metode_id', $exception->errors());
        }
        $service->upload($request, $buyer, $bank->id, UploadedFile::fake()->image('proof.jpg'));
        $proof = PaymentProof::where('order_id', $invoice->fresh()->order_id)->firstOrFail();
        $service->verify($proof, $actor);
        $this->assertSame('Lunas', $request->fresh()->status);
        $this->assertSame('paid', $invoice->fresh()->status);
        Notification::assertSentTo($owner, ProductPaymentReceived::class);
    }
}

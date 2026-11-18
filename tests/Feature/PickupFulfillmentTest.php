<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Notifications\PickupReady;
use App\Services\PengajuanWorkflow;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class PickupFulfillmentTest extends TestCase
{
    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'pickup_test');
        $app['config']->set('database.connections.pickup_test', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '', 'foreign_key_constraints' => true]);
        Artisan::call('migrate', ['--database' => 'pickup_test', '--force' => true]);

        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(UsecaseSeeder::class);
        User::flushPermissionCache();
        Notification::fake();
        Storage::fake('local');
    }

    private function fixture(string $method = 'Ambil di PNJ'): array
    {
        $buyer = User::factory()->customer()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $category = ProductCategory::create(['name' => 'TEST', 'slug' => uniqid('test'), 'is_active' => true]);
        $product = Product::create(['category_id' => $category->id, 'owner_id' => $owner->id, 'name' => 'TEST', 'slug' => uniqid('test'), 'base_price' => 100, 'final_price' => 100]);
        $p = Pengajuan::create(['code' => uniqid('TEST'), 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'produk', 'status' => 'Lunas', 'metode_pengambilan' => $method]);

        return [$p, $owner, $buyer];
    }

    public function test_completion_requires_identity_contact_and_photo_and_ready_timestamp(): void
    {
        [$p, $owner] = $this->fixture();
        $url = route('pengelola.pesanan.update', $p);
        $this->actingAs($owner)->patch($url, ['status' => 'Selesai'])->assertSessionHasErrors(['collector_name', 'collector_contact', 'handover_photo']);
        $this->patch($url, ['status' => 'Selesai', 'collector_name' => 'TEST', 'collector_contact' => 'TEST', 'handover_photo' => UploadedFile::fake()->image('test.jpg')])->assertSessionHasErrors('status');
        $this->patch($url, ['status' => 'Diproses', 'pickup_action' => 'ready'])->assertSessionHasNoErrors();
        $this->patch($url, ['status' => 'Selesai', 'collector_name' => 'TEST', 'collector_contact' => 'TEST'])->assertSessionHasErrors('handover_photo');
        $this->patch($url, ['status' => 'Selesai', 'handover_photo' => UploadedFile::fake()->image('test.jpg')])->assertSessionHasErrors(['collector_name', 'collector_contact']);
        $this->patch($url, ['status' => 'Selesai', 'collector_name' => 'TEST', 'collector_contact' => 'TEST', 'handover_photo' => UploadedFile::fake()->create('test.jpg', 10, 'text/plain')])->assertSessionHasErrors('handover_photo');
        $this->patch($url, ['status' => 'Selesai', 'collector_name' => 'TEST', 'collector_contact' => 'TEST', 'handover_photo' => UploadedFile::fake()->image('large.jpg')->size(5121)])->assertSessionHasErrors('handover_photo');
        $this->assertSame('Diproses', $p->fresh()->status);
        $this->assertNull($p->fresh()->handed_over_at);
    }

    public function test_completion_is_private_immutable_and_visible_in_customer_history(): void
    {
        [$p, $owner, $buyer] = $this->fixture();
        $url = route('pengelola.pesanan.update', $p);
        $this->actingAs($owner)->patch($url, ['status' => 'Diproses', 'pickup_action' => 'ready'])->assertSessionHasNoErrors();
        $this->post($url, ['_method' => 'patch', 'status' => 'Selesai', 'collector_name' => 'TEST COLLECTOR', 'collector_contact' => 'TEST CONTACT', 'handover_photo' => UploadedFile::fake()->image('test.jpg')])->assertSessionHasNoErrors();
        $p->refresh();
        $this->assertSame('Selesai', $p->status);
        $this->assertSame($owner->id, $p->handed_over_by);
        Storage::disk('local')->assertExists($p->handover_photo_path);
        $this->assertArrayNotHasKey('handover_photo_path', $p->toArray());
        $this->assertArrayNotHasKey('collector_name', $p->toArray());
        $this->actingAs($buyer)->get(route('pickup.photo', $p))->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->get(route('customer.riwayat'))->assertInertia(fn ($page) => $page->where('riwayat.0.pickup.collector_name', 'TEST COLLECTOR')->where('riwayat.0.pickup.photo_url', route('pickup.photo', $p))->has('riwayat.0.history', 3));
        $this->get(route('customer.pengajuan.show', $p))->assertOk();
        $other = User::factory()->customer()->create();
        $this->actingAs($other)->get(route('pickup.photo', $p))->assertNotFound();
        $this->get(route('customer.pengajuan.show', $p))->assertForbidden();
        $this->get(route('customer.riwayat'))->assertInertia(fn ($page) => $page->has('riwayat', 0));
        $outsider = User::factory()->create(['role' => 'admin_pengelola']);
        $this->actingAs($outsider)->get(route('pickup.photo', $p))->assertNotFound();
        $this->patch($url, ['status' => 'Diproses', 'pickup_action' => 'ready'])->assertNotFound();
        $this->actingAs($owner)->patch($url, ['status' => 'Selesai', 'collector_name' => 'REPLACED', 'collector_contact' => 'OTHER', 'handover_photo' => UploadedFile::fake()->image('other.jpg')])->assertSessionHasErrors('status');
        $this->assertSame('TEST COLLECTOR', $p->fresh()->collector_name);
        $this->assertCount(1, Storage::disk('local')->allFiles('pickup-handover'));
        $this->actingAs($owner)->get(route('pickup.photo', $p))->assertOk();
    }

    public function test_rtpu_and_workflow_cannot_bypass_pickup_evidence(): void
    {
        [$p] = $this->fixture();
        $p->setStatus('Diproses');
        $p->save();
        $actor = User::factory()->adminRtpu()->create();
        $this->actingAs($actor)->patch(route('rtpu.status.update', $p), ['status' => 'Selesai'])->assertSessionHasErrors('status');
        $this->assertSame('Diproses', $p->fresh()->status);
        $this->expectException(ValidationException::class);
        app(PengajuanWorkflow::class)->transition($p->fresh(), 'Selesai');
    }

    public function test_preparing_does_not_claim_ready_and_shipping_is_unchanged(): void
    {
        [$p,$owner,$buyer] = $this->fixture();
        $p->setStatus('Diproses');
        $p->save();
        $this->actingAs($buyer)->get(route('customer.pengajuan.show', $p))->assertInertia(fn ($page) => $page->where('item.pickup.ready', false));
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p), ['status' => 'Diproses'])->assertSessionHasErrors('pickup_action');
        [$shipping,$shippingOwner] = $this->fixture('Diantar');
        $this->actingAs($shippingOwner)->patch(route('pengelola.pesanan.update', $shipping), ['status' => 'Diproses'])->assertSessionHasNoErrors();
        // Kurir tidak bisa diselesaikan tanpa data pengiriman; wajib isi kurir + resi dulu.
        $this->patch(route('pengelola.pesanan.update', $shipping), ['status' => 'Selesai'])->assertSessionHasErrors('status');
        $this->patch(route('pengelola.pesanan.update', $shipping), ['status' => 'Dikirim'])->assertSessionHasErrors(['courier_name', 'tracking_number']);
        $this->patch(route('pengelola.pesanan.update', $shipping), ['status' => 'Dikirim', 'courier_name' => 'JNE', 'tracking_number' => 'JNE-TEST-001'])->assertSessionHasNoErrors();
        $this->assertSame('Dikirim', $shipping->fresh()->status);
        $this->assertSame('JNE-TEST-001', $shipping->fresh()->tracking_number);
        $this->patch(route('pengelola.pesanan.update', $shipping), ['status' => 'Selesai'])->assertSessionHasNoErrors();
        $this->assertSame('Selesai', $shipping->fresh()->status);
        $this->assertNull($shipping->fresh()->handed_over_at);
    }

    public function test_history_has_only_real_issued_invoice_links_and_legacy_completion_has_no_invented_proof(): void
    {
        [$p,$owner,$buyer] = $this->fixture();
        // Historical row predates evidence requirements; migration must not backfill it.
        Pengajuan::whereKey($p->id)->update(['status' => 'Selesai']);
        $this->actingAs($buyer)->get(route('customer.riwayat'))->assertInertia(fn ($page) => $page->where('riwayat.0.invoice_url', null)->where('riwayat.0.pickup.photo_url', null));
        Invoice::create(['pengajuan_id' => $p->id, 'invoice_number' => uniqid('TEST'), 'issued_by' => $owner->id, 'issued_at' => now(), 'due_at' => now()->addDay(), 'subtotal' => 100, 'tax_rate_snapshot' => 0, 'tax_amount' => 0, 'total' => 100, 'status' => 'paid']);
        $this->get(route('customer.riwayat'))->assertInertia(fn ($page) => $page->where('riwayat.0.invoice_url', route('customer.pengajuan.invoice', $p)));
        $this->get(route('customer.pengajuan.invoice', $p))->assertOk();
        $this->actingAs(User::factory()->customer()->create())->get(route('customer.pengajuan.invoice', $p))->assertForbidden();
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p), ['status' => 'Diproses', 'pickup_action' => 'ready'])->assertSessionHasErrors('status');
        $this->assertNull($p->fresh()->pickup_ready_at);
    }

    public function test_owner_explicitly_marks_ready_and_customer_sees_recorded_readiness(): void
    {
        [$p, $owner, $buyer] = $this->fixture();
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p), ['status' => 'Diproses', 'pickup_action' => 'ready'])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertNotNull($p->fresh()->pickup_ready_at);
        $this->assertSame('Diproses', $p->fresh()->status);
        $this->actingAs($buyer)->get(route('customer.pengajuan.show', $p))->assertOk()->assertInertia(fn ($page) => $page->where('item.pickup.ready', true)->where('item.pickup.window', '08.00–16.00 WIB'));
        Notification::assertSentTo($buyer, PickupReady::class);
    }
}

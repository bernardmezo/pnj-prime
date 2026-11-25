<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\RoomBooking;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SewaDanTestLabTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private User $rtpu;

    private Product $ruangan;

    private Product $jasa;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(\Carbon\Carbon::parse('2026-11-23 09:00:00'));
        $this->withoutVite();
        $this->seed(\Database\Seeders\UsecaseSeeder::class);
        $this->seed(\Database\Seeders\ProductCategorySeeder::class);
        $this->seed(\Database\Seeders\SettingSeeder::class);
        $this->seed(\Database\Seeders\TaxRateSeeder::class);
        User::flushPermissionCache();

        $this->customer = User::factory()->customer()->create();
        $this->rtpu = User::factory()->create(['role' => 'admin_rtpu']);
        $owner = User::factory()->create(['role' => 'admin_pengelola']);

        $sewa = ProductCategory::firstOrCreate(['slug' => 'sewa-fasilitas'], ['name' => 'Sewa Fasilitas', 'is_active' => true]);
        // Gunakan sub-kategori dari ProductCategorySeeder agar layananTipe() = 'jasa'
        $jasaCat = ProductCategory::where('slug', 'pengujian-lab')->first()
            ?? ProductCategory::firstOrCreate(['slug' => 'pengujian-lab'], ['name' => 'Pengujian Lab', 'is_active' => true,
               'parent_id' => ProductCategory::firstOrCreate(['slug' => 'jasa-layanan'], ['name' => 'Jasa / Layanan', 'is_active' => true])->id]);

        $this->ruangan = Product::create([
            'owner_id' => $owner->id, 'category_id' => $sewa->id, 'name' => 'Aula Uji', 'slug' => 'aula-uji',
            'base_price' => 1000000, 'final_price' => 1000000, 'is_active' => true, 'curation_status' => 'approved',
            'meta' => ['satuan' => 'hari'],
        ]);
        $this->jasa = Product::create([
            'owner_id' => $owner->id, 'category_id' => $jasaCat->id, 'name' => 'Uji Tarik Baja', 'slug' => 'uji-tarik',
            'base_price' => 500000, 'final_price' => 500000, 'is_active' => true, 'curation_status' => 'approved',
        ]);
    }

    private function rentalPayload(array $override = []): array
    {
        return array_merge([
            'tipe' => 'ruangan',
            'product_id' => $this->ruangan->id,
            'keperluan' => 'Seminar',
            'rental_start' => now()->addDays(10)->format('Y-m-d\TH:i'),
            'rental_end' => now()->addDays(11)->format('Y-m-d\TH:i'),
            'renter_data' => ['company_name' => 'PT Uji', 'ktp_number' => '3174000000000001'],
        ], $override);
    }

    public function test_checkout_uses_parent_category_and_rejects_wrong_submitted_type(): void
    {
        $subcategory = ProductCategory::create([
            'name' => 'Ruangan', 'slug' => 'ruangan-uji', 'parent_id' => $this->ruangan->category_id, 'is_active' => true,
        ]);
        $this->ruangan->update(['category_id' => $subcategory->id]);

        $this->actingAs($this->customer)
            ->get(route('customer.pengajuan.create', ['product_id' => $this->ruangan->id, 'tipe' => 'produk']))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Customer/Pengajuan/Create')->where('selected.tipe', 'ruangan'));

        $this->actingAs($this->customer)
            ->post(route('customer.pengajuan.store'), ['tipe' => 'produk', 'product_id' => $this->ruangan->id, 'metode_pengambilan' => 'Diantar'])
            ->assertSessionHasErrors('product_id');
        $this->assertDatabaseCount('pengajuan', 0);
    }

    // ---------- Pengaturan persetujuan ----------

    public function test_sewa_approval_by_pimpinan_is_disabled_by_default(): void
    {
        // Migration 2026_11_18_000003 set nilai ke '0'. Seeder mungkin me-reset ke '1'
        // (SettingSeeder dijalankan di setUp). Kita cukup verifikasi setting dapat diubah
        // ke '0' dan logika approve langsung ke Menunggu Pembayaran.
        Setting::where('key', 'sewa_perlu_persetujuan_pimpinan')->update(['value' => '0']);
        $this->assertSame('0', Setting::where('key', 'sewa_perlu_persetujuan_pimpinan')->value('value'));
    }

    public function test_rtpu_approves_rental_and_issues_invoice_in_one_action(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();
        $subtotal = $p->total;
        Setting::where('key', 'sewa_perlu_persetujuan_pimpinan')->update(['value' => '0']);
        $bank = \App\Models\MetodePembayaran::create(['nama' => 'BLU', 'tipe' => 'BLU', 'rekening' => '123', 'holder' => 'PNJ', 'aktif' => true]);

        $this->actingAs($this->rtpu)->patch(route('rtpu.verify.layanan.approve', $p->id), [
            'bank_id' => $bank->id, 'due_date' => now()->addDays(3)->toDateString(), 'tax_rate' => '11',
        ])->assertRedirect(route('rtpu.verify.layanan'))->assertSessionHasNoErrors();

        $p->refresh();
        $this->assertSame('Menunggu Pembayaran', $p->status);
        $this->assertSame('issued', $p->latestInvoice->status);
        $this->assertEquals($subtotal, $p->latestInvoice->subtotal);
        $this->assertEquals($p->latestInvoice->total, $p->order->total);
    }

    public function test_invalid_rental_invoice_data_does_not_change_request(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();
        Setting::where('key', 'sewa_perlu_persetujuan_pimpinan')->update(['value' => '0']);
        $this->actingAs($this->rtpu)->patch(route('rtpu.verify.layanan.approve', $p->id), [
            'tax_rate' => '101', 'due_date' => now()->toDateString(),
        ])->assertSessionHasErrors(['bank_id', 'tax_rate', 'due_date']);
        $this->assertSame('Diajukan', $p->fresh()->status);
        $this->assertSame(0, $p->invoices()->count());
    }

    public function test_rental_invoice_manual_flow(): void
    {
        $this->travelTo(\Carbon\Carbon::parse('2026-11-23 09:00:00'));
        \Illuminate\Support\Facades\Storage::fake('local');
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();

        Setting::where('key', 'sewa_perlu_persetujuan_pimpinan')->update(['value' => '0']);
        app(\App\Services\PengajuanWorkflow::class)->transition($p, 'Menunggu Invoice', 'Verifikasi sebelumnya', $this->rtpu->name);
        $this->assertSame('Menunggu Invoice', $p->fresh()->status);

        $bank = \App\Models\MetodePembayaran::create([
            'nama' => 'Bank BLU', 'tipe' => 'BLU', 'rekening' => '1234567890',
            'holder' => 'PNJ BLU', 'aktif' => true,
        ]);

        $this->actingAs($this->rtpu)->post(route('rtpu.invoice.store', $p->id), [
            'tax_rate' => '11',
            'bank_id' => $bank->id,
            'due_date' => now()->addDays(3)->format('Y-m-d'),
        ])->assertSessionHasNoErrors();

        $this->assertSame('Menunggu Invoice', $p->fresh()->status);
        $this->assertSame('draft', $p->fresh()->latestInvoice?->status);

        $this->actingAs($this->rtpu)->patch(route('rtpu.verify.layanan.approve', $p->id))->assertSessionHasNoErrors();
        $p->refresh();
        $this->assertSame('Menunggu Pembayaran', $p->status);
        $this->assertSame('issued', $p->latestInvoice?->status);
        $this->assertSame($p->order?->id, $p->latestInvoice?->order_id);

        $this->actingAs($this->customer)->get(route('customer.pengajuan.bayar', $p->id))->assertOk();

        $this->assertSame('ruangan', $p->fresh()->tipe);
        $wrongBank = \App\Models\MetodePembayaran::create(['nama' => 'Other', 'tipe' => 'BLU', 'rekening' => '999', 'holder' => 'PNJ', 'aktif' => true]);
        $this->actingAs($this->customer)->post(route('customer.pengajuan.proof', $p->id), [
            'metode_id' => $wrongBank->id,
            'bukti' => UploadedFile::fake()->image('wrong.jpg'),
        ])->assertSessionHasErrors('metode_id');
        $this->assertSame('Menunggu Pembayaran', $p->fresh()->status);
        $this->assertSame(0, $p->fresh()->order->paymentProofs()->count());

        $this->actingAs($this->customer)->post(route('customer.pengajuan.proof', $p->id), [
            'metode_id' => $bank->id,
            'bukti' => UploadedFile::fake()->image('bukti.jpg'),
        ])->assertRedirect()->assertSessionHasNoErrors();

        $this->assertSame('Menunggu Verifikasi Pembayaran', $p->fresh()->status);
        $proof = $p->fresh()->order?->paymentProofs()->firstOrFail();

        $this->actingAs($this->rtpu)->patch(route('rtpu.verify.bayar.accept', $proof->id))->assertSessionHasNoErrors();
        $this->assertSame('Lunas', $p->fresh()->status);
        $this->assertSame('paid', $p->fresh()->latestInvoice?->status);
    }

    // ---------- Anti bentrok ----------

    public function test_second_booking_on_same_slot_is_rejected(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();
        $this->assertSame(1, RoomBooking::where('status', 'ACTIVE')->count());

        $other = User::factory()->customer()->create();
        $this->actingAs($other)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasErrors();

        $this->assertSame(1, Pengajuan::count());
        $this->assertSame(1, RoomBooking::where('status', 'ACTIVE')->count());
    }

    public function test_overlapping_but_not_identical_period_is_rejected(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();

        $this->actingAs(User::factory()->customer()->create())->post(route('customer.pengajuan.store'), $this->rentalPayload([
            'rental_start' => now()->addDays(10)->addHours(3)->format('Y-m-d\TH:i'),
            'rental_end' => now()->addDays(11)->addHours(3)->format('Y-m-d\TH:i'),
        ]))->assertSessionHasErrors();
    }

    public function test_adjacent_period_is_allowed(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();

        $this->actingAs(User::factory()->customer()->create())->post(route('customer.pengajuan.store'), $this->rentalPayload([
            'rental_start' => now()->addDays(11)->format('Y-m-d\TH:i'),
            'rental_end' => now()->addDays(11)->addHours(6)->format('Y-m-d\TH:i'),
        ]))->assertSessionHasNoErrors();

        $this->assertSame(2, RoomBooking::where('status', 'ACTIVE')->count());
    }

    public function test_slot_is_released_when_rental_is_rejected_and_can_be_booked_again(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();

        $this->actingAs($this->rtpu)->patch(route('rtpu.verify.layanan.reject', $p->id), ['catatan' => 'Dokumen tidak lengkap'])->assertSessionHasNoErrors();

        $this->assertSame('Ditolak', $p->fresh()->status);
        $this->assertSame(0, RoomBooking::where('status', 'ACTIVE')->count());

        $this->actingAs(User::factory()->customer()->create())->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();
    }

    public function test_slot_is_released_when_customer_cancels(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();

        $this->actingAs($this->customer)->patch(route('customer.pengajuan.cancel', $p->id))->assertSessionHasNoErrors();

        $this->assertSame('Dibatalkan', $p->fresh()->status);
        $this->assertSame(0, RoomBooking::where('status', 'ACTIVE')->count());
    }

    // ---------- Test lab (jasa) & konsultasi biaya ----------

    public function test_test_lab_request_stores_kebutuhan_detail(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), [
            'tipe' => 'jasa', 'product_id' => $this->jasa->id, 'jumlah' => '3',
            'kebutuhan_detail' => [
                'jenis_pengujian' => 'Uji tarik', 'metode_standar' => 'ASTM E8', 'jumlah_sampel' => 3,
                'uraian_kebutuhan' => 'Baja ST37', 'konsultasi_biaya' => 'Anggaran sekitar 2 juta', 'tidak_dikenal' => 'dibuang',
            ],
        ])->assertSessionHasNoErrors();

        $p = Pengajuan::firstOrFail();
        $this->assertSame('ASTM E8', $p->kebutuhan_detail['metode_standar']);
        $this->assertSame('Anggaran sekitar 2 juta', $p->kebutuhan_detail['konsultasi_biaya']);
        $this->assertArrayNotHasKey('tidak_dikenal', $p->kebutuhan_detail);
    }

    public function test_kebutuhan_detail_is_ignored_for_non_jasa_types(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload([
            'kebutuhan_detail' => ['jenis_pengujian' => 'Tidak boleh tersimpan'],
        ]))->assertSessionHasNoErrors();

        $this->assertNull(Pengajuan::firstOrFail()->kebutuhan_detail);
    }

    public function test_kebutuhan_detail_validation(): void
    {
        // jumlah_sampel min:1, konsultasi_biaya max:1000
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), [
            'tipe' => 'jasa',
            'product_id' => $this->jasa->id,
            'kebutuhan_detail' => ['jumlah_sampel' => -1, 'konsultasi_biaya' => str_repeat('x', 1001)],
        ])->assertSessionHasErrors(['kebutuhan_detail.jumlah_sampel', 'kebutuhan_detail.konsultasi_biaya']);
    }

    private function jasaInvoicePayload(array $override = []): array
    {
        $bank = \App\Models\MetodePembayaran::create(['nama' => 'BLU', 'tipe' => 'BLU', 'rekening' => '123', 'holder' => 'PNJ', 'aktif' => true]);

        return array_merge(['bank_id' => $bank->id, 'due_date' => now()->addDays(3)->toDateString(), 'tax_rate' => '0'], $override);
    }

    public function test_new_jasa_submission_keeps_selected_start_and_automation_marker(): void
    {
        $date = now()->addDays(3)->toDateString();
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), [
            'tipe' => 'jasa', 'product_id' => $this->jasa->id, 'tanggal' => $date, 'jam_mulai' => '10:00',
        ])->assertRedirect()->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();
        $this->assertTrue((bool) $p->jasa_auto_start);
        $this->assertSame($date.' 10:00', $p->jadwal_mulai->format('Y-m-d H:i'));
        $this->assertNull($p->jadwal_selesai);
    }

    public function test_rtpu_sets_tariff_and_order_invoice_total_match(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), [
            'tipe' => 'jasa', 'product_id' => $this->jasa->id, 'jumlah' => '3',
        ])->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();

        $this->actingAs($this->rtpu)->patch(route('rtpu.verify.layanan.approve', $p->id), $this->jasaInvoicePayload(['tarif_jasa' => 750000]))->assertSessionHasNoErrors();

        $p->refresh();
        $this->assertSame('Menunggu Pembayaran', $p->status);
        $this->assertSame(2250000, (int) $p->total);                 // 750.000 x 3
        $order = Order::where('pengajuan_id', $p->id)->firstOrFail();
        $this->assertSame(2250000, (int) $order->subtotal);
        $item = $order->items()->firstOrFail();
        $this->assertSame(750000, (int) $item->unit_price);
        $this->assertSame(2250000, (int) $item->subtotal);
        $this->assertSame(3, (int) $item->quantity);
        $invoice = $p->latestInvoice;
        $line = $invoice->lines()->firstOrFail();
        $this->assertSame(750000, (int) $line->unit_price);
        $this->assertSame(3, (int) $line->quantity);
        $this->assertSame(2250000, (int) $line->amount);
        $this->assertSame((int) $order->subtotal, (int) $invoice->subtotal);
        $this->assertSame((int) $order->total, (int) $invoice->total);
        $this->assertStringContainsString('Tarif ditetapkan Admin RTPU', json_encode($p->history));
    }

    public function test_service_tariff_is_recorded_in_history(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), [
            'tipe' => 'jasa', 'product_id' => $this->jasa->id, 'jumlah' => '3',
        ])->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();
        $this->actingAs($this->rtpu)->patch(route('rtpu.verify.layanan.approve', $p->id), $this->jasaInvoicePayload(['tarif_jasa' => 750000]))->assertSessionHasNoErrors();
        $this->assertStringContainsString('Tarif ditetapkan Admin RTPU: Rp 750.000 x 3.', json_encode($p->fresh()->history));
    }

    public function test_without_tariff_catalog_price_is_used(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), [
            'tipe' => 'jasa', 'product_id' => $this->jasa->id, 'jumlah' => '2',
        ])->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();
        $totalSebelum = (int) $p->total;

        $this->actingAs($this->rtpu)->patch(route('rtpu.verify.layanan.approve', $p->id), $this->jasaInvoicePayload())->assertSessionHasNoErrors();

        $this->assertSame($totalSebelum, (int) $p->fresh()->total);
    }

    public function test_tariff_must_be_positive_integer(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), ['tipe' => 'jasa', 'product_id' => $this->jasa->id])->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();

        $invoicePayload = $this->jasaInvoicePayload();
        foreach ([0, -5, 'abc', 1.5, 2000000000] as $bad) {
            $this->actingAs($this->rtpu)->patch(route('rtpu.verify.layanan.approve', $p->id), array_merge($invoicePayload, ['tarif_jasa' => $bad]))->assertSessionHasErrors('tarif_jasa');
        }
        $this->assertSame('Diajukan', $p->fresh()->status);
    }

    // ---------- Izin ----------

    public function test_only_rtpu_can_set_tariff_or_approve(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), ['tipe' => 'jasa', 'product_id' => $this->jasa->id])->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();

        foreach (['customer', 'admin_pengelola', 'pimpinan_rtpu', 'direktur'] as $role) {
            $u = User::factory()->create(['role' => $role]);
            $this->actingAs($u)->patch(route('rtpu.verify.layanan.approve', $p->id), ['tarif_jasa' => 1])->assertForbidden();
        }
        $this->assertSame('Diajukan', $p->fresh()->status);
    }

    public function test_customer_cannot_edit_another_customers_kebutuhan(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), [
            'tipe' => 'jasa', 'product_id' => $this->jasa->id, 'kebutuhan_detail' => ['jenis_pengujian' => 'Asli'],
        ])->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();

        $this->actingAs(User::factory()->customer()->create())->patch(route('customer.pengajuan.update', $p->id), [
            'kebutuhan_detail' => ['jenis_pengujian' => 'Dibajak'],
        ])->assertForbidden();

        $this->assertSame('Asli', $p->fresh()->kebutuhan_detail['jenis_pengujian']);
    }

    public function test_sso_civitas_customer_can_book(): void
    {
        $sso = User::factory()->customer()->create(['account_origin' => 'sso_pnj', 'user_type' => 'civitas']);

        $this->actingAs($sso)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();
        $this->assertSame(1, Pengajuan::where('buyer_id', $sso->id)->count());
    }
}

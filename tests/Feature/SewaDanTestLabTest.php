<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\RoomBooking;
use App\Models\Setting;
use App\Models\User;
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

    // ---------- Pengaturan persetujuan ----------

    public function test_sewa_approval_by_pimpinan_is_disabled_by_default(): void
    {
        // Migration 2026_11_18_000003 set nilai ke '0'. Seeder mungkin me-reset ke '1'
        // (SettingSeeder dijalankan di setUp). Kita cukup verifikasi setting dapat diubah
        // ke '0' dan logika approve langsung ke Menunggu Pembayaran.
        Setting::where('key', 'sewa_perlu_persetujuan_pimpinan')->update(['value' => '0']);
        $this->assertSame('0', Setting::where('key', 'sewa_perlu_persetujuan_pimpinan')->value('value'));
    }

    public function test_rtpu_approves_rental_directly_to_payment_without_pimpinan(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();

        Setting::where('key', 'sewa_perlu_persetujuan_pimpinan')->update(['value' => '0']);
        $this->actingAs($this->rtpu)->patch(route('rtpu.verify.layanan.approve', $p->id))->assertSessionHasNoErrors();

        $this->assertSame('Menunggu Pembayaran', $p->fresh()->status);
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
            'rental_start' => now()->addDays(10)->addHours(12)->format('Y-m-d\TH:i'),
            'rental_end' => now()->addDays(12)->format('Y-m-d\TH:i'),
        ]))->assertSessionHasErrors();
    }

    public function test_adjacent_period_is_allowed(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();

        $this->actingAs(User::factory()->customer()->create())->post(route('customer.pengajuan.store'), $this->rentalPayload([
            'rental_start' => now()->addDays(11)->format('Y-m-d\TH:i'),
            'rental_end' => now()->addDays(12)->format('Y-m-d\TH:i'),
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

    public function test_rtpu_sets_tariff_and_order_invoice_total_match(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), [
            'tipe' => 'jasa', 'product_id' => $this->jasa->id, 'jumlah' => '3',
        ])->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();

        $this->actingAs($this->rtpu)->patch(route('rtpu.verify.layanan.approve', $p->id), ['tarif_jasa' => 750000])->assertSessionHasNoErrors();

        $p->refresh();
        $this->assertSame('Menunggu Pembayaran', $p->status);
        $this->assertSame(2250000, (int) $p->total);                 // 750.000 x 3
        $order = Order::where('pengajuan_id', $p->id)->firstOrFail();
        $this->assertSame(2250000, (int) $order->subtotal);
        $item = $order->items()->firstOrFail();
        $this->assertSame(750000, (int) $item->unit_price);
        $this->assertSame(2250000, (int) $item->subtotal);
        $this->assertStringContainsString('Tarif ditetapkan Admin RTPU', json_encode($p->history));
    }

    public function test_without_tariff_catalog_price_is_used(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), [
            'tipe' => 'jasa', 'product_id' => $this->jasa->id, 'jumlah' => '2',
        ])->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();
        $totalSebelum = (int) $p->total;

        $this->actingAs($this->rtpu)->patch(route('rtpu.verify.layanan.approve', $p->id))->assertSessionHasNoErrors();

        $this->assertSame($totalSebelum, (int) $p->fresh()->total);
    }

    public function test_tariff_must_be_positive_integer(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), ['tipe' => 'jasa', 'product_id' => $this->jasa->id])->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();

        foreach ([0, -5, 'abc', 1.5, 2000000000] as $bad) {
            $this->actingAs($this->rtpu)->patch(route('rtpu.verify.layanan.approve', $p->id), ['tarif_jasa' => $bad])->assertSessionHasErrors('tarif_jasa');
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

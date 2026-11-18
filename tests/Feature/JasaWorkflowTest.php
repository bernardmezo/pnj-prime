<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class JasaWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;

    private User $pengelola;

    private User $admin_rtpu;

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
        $this->pengelola = User::factory()->create(['role' => 'admin_pengelola']);
        $this->admin_rtpu = User::factory()->create(['role' => 'admin_rtpu']);

        $cat = ProductCategory::where('slug', 'pengujian-lab')->first() ??
            ProductCategory::create(['slug' => 'pengujian-lab', 'name' => 'Pengujian Lab', 'is_active' => true,
               'parent_id' => ProductCategory::firstOrCreate(['slug' => 'jasa-layanan'], ['name' => 'Jasa / Layanan', 'is_active' => true])->id]);
        $this->jasa = Product::create([
            'owner_id' => $this->pengelola->id, 'category_id' => $cat->id, 'name' => 'Uji Tarik Baja', 'slug' => 'uji-tarik',
            'base_price' => 500000, 'final_price' => 500000, 'is_active' => true, 'curation_status' => 'approved',
        ]);
    }

    private function makeOrder(array $override = []): Pengajuan
    {
        $p = Pengajuan::create(array_merge([
            'buyer_id' => $this->customer->id, 'product_id' => $this->jasa->id, 'tipe' => 'jasa',
            'code' => 'PNJ-TEST-'.rand(), 'status' => 'Lunas', 'total' => 500000, 'jumlah' => '1',
        ], $override));
        $p->order()->create([
            'order_number' => 'ORD-'.rand(), 'buyer_id' => $this->customer->id, 'subtotal' => 500000,
            'total' => 500000, 'status' => 'lunas',
        ]);

        return $p->fresh();
    }

    private function validSchedule(): array
    {
        return [
            'jadwal_mulai' => now()->addDay()->format('Y-m-d\TH:i'),
            'jadwal_selesai' => now()->addDays(3)->format('Y-m-d\TH:i'),
        ];
    }

    // ========== Admin Pengelola: jadwal, kerjakan, unggah ==========

    public function test_full_jasa_flow_from_lunas_to_selesai_with_revision(): void
    {
        Storage::fake('local');
        $p = $this->makeOrder();
        $start = fn (string $status, array $extra = []) => $this->actingAs($this->pengelola)
            ->patch(route('pengelola.pesanan.update', $p->id), array_merge(['status' => $status], $extra));

        $start('Diproses')->assertSessionHasNoErrors();
        $this->assertSame('Diproses', $p->fresh()->status);

        $start('Dijadwalkan', $this->validSchedule())->assertSessionHasNoErrors();
        $this->assertSame('Dijadwalkan', $p->fresh()->status);

        $start('Dikerjakan')->assertSessionHasNoErrors();
        $this->assertSame('Dikerjakan', $p->fresh()->status);

        // Unggah hasil awal
        $start('Hasil Diunggah', ['hasil_files' => [UploadedFile::fake()->create('laporan.pdf', 200, 'application/pdf')]])
            ->assertSessionHasNoErrors();
        $this->assertSame('Hasil Diunggah', $p->fresh()->status);
        $this->assertCount(1, $p->fresh()->hasil_files);

        // Customer minta revisi -> Pengelola kerjakan lagi -> unggah ulang -> Customer konfirmasi
        $this->actingAs($this->customer)->patch(route('customer.pengajuan.jasa.revision', $p->id), ['catatan' => 'Grafik kurang jelas'])->assertSessionHasNoErrors();
        $this->assertSame('Dikerjakan', $p->fresh()->status);
        $this->assertSame(1, (int) $p->fresh()->revision_count);

        $start('Hasil Diunggah', ['hasil_files' => [UploadedFile::fake()->create('laporan-revisi.pdf', 200, 'application/pdf')]])
            ->assertSessionHasNoErrors();
        $this->assertCount(2, $p->fresh()->hasil_files);

        $this->actingAs($this->customer)->patch(route('customer.pengajuan.jasa.confirm', $p->id))->assertSessionHasNoErrors();
        $this->assertSame('Selesai', $p->fresh()->status);
        $this->assertSame('selesai', $p->fresh()->order->status);
    }

    public function test_pengelola_starts_processing_paid_jasa(): void
    {
        $p = $this->makeOrder();
        $this->actingAs($this->pengelola)->patch(route('pengelola.pesanan.update', $p->id), ['status' => 'Diproses'])->assertSessionHasNoErrors();

        $this->assertSame('Diproses', $p->fresh()->status);
        $this->assertSame('diproses', $p->fresh()->order->status);
    }

    public function test_pengelola_sets_schedule(): void
    {
        $p = $this->makeOrder(['status' => 'Diproses']);
        $this->actingAs($this->pengelola)->patch(route('pengelola.pesanan.update', $p->id), array_merge(
            ['status' => 'Dijadwalkan'], $this->validSchedule()
        ))->assertSessionHasNoErrors();

        $this->assertSame('Dijadwalkan', $p->fresh()->status);
        $this->assertNotNull($p->fresh()->jadwal_mulai);
    }

    public function test_pengelola_starts_work(): void
    {
        $p = $this->makeOrder(['status' => 'Dijadwalkan', 'jadwal_mulai' => now(), 'jadwal_selesai' => now()->addDays(2)]);
        $this->actingAs($this->pengelola)->patch(route('pengelola.pesanan.update', $p->id), ['status' => 'Dikerjakan'])->assertSessionHasNoErrors();

        $this->assertSame('Dikerjakan', $p->fresh()->status);
    }

    public function test_pengelola_uploads_result_files(): void
    {
        Storage::fake('local');
        $p = $this->makeOrder(['status' => 'Dikerjakan', 'jadwal_mulai' => now(), 'jadwal_selesai' => now()->addDay()]);
        $this->actingAs($this->pengelola)->patch(route('pengelola.pesanan.update', $p->id), [
            'status' => 'Hasil Diunggah',
            'hasil_files' => [
                UploadedFile::fake()->create('laporan.pdf', 200, 'application/pdf'),
                UploadedFile::fake()->create('data.xlsx', 500, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
            ],
        ])->assertSessionHasNoErrors();

        $p->refresh();
        $this->assertSame('Hasil Diunggah', $p->status);
        $this->assertCount(2, $p->hasil_files);
        Storage::disk('local')->assertExists($p->hasil_files[0]['path']);
    }

    public function test_pengelola_must_upload_at_least_one_file(): void
    {
        $p = $this->makeOrder(['status' => 'Dikerjakan']);
        $this->actingAs($this->pengelola)->patch(route('pengelola.pesanan.update', $p->id), [
            'status' => 'Hasil Diunggah',
            'hasil_files' => [],
        ])->assertSessionHasErrors('hasil_files');

        $this->assertSame('Dikerjakan', $p->fresh()->status);
    }

    public function test_schedule_validates_datetime(): void
    {
        $p = $this->makeOrder(['status' => 'Diproses']);
        $schedule = $this->validSchedule();

        foreach (['invalid', null, now()->subDays(2)->format('Y-m-d\TH:i')] as $bad) {
            $this->actingAs($this->pengelola)->patch(route('pengelola.pesanan.update', $p->id), [
                'status' => 'Dijadwalkan', 'jadwal_mulai' => $bad, 'jadwal_selesai' => $schedule['jadwal_selesai'],
            ])->assertSessionHasErrors('jadwal_mulai');
        }
        // Perkiraan selesai lebih awal dari mulai -> ditolak
        $this->actingAs($this->pengelola)->patch(route('pengelola.pesanan.update', $p->id), [
            'status' => 'Dijadwalkan', 'jadwal_mulai' => $schedule['jadwal_selesai'], 'jadwal_selesai' => $schedule['jadwal_mulai'],
        ])->assertSessionHasErrors('jadwal_selesai');

        $this->assertSame('Diproses', $p->fresh()->status);
        $this->assertNull($p->fresh()->jadwal_mulai);
    }

    // ========== Customer: konfirmasi, revisi, rating ==========

    public function test_customer_confirms_completion(): void
    {
        Storage::fake('local');
        $p = $this->makeOrder(['status' => 'Hasil Diunggah', 'hasil_files' => [
            ['path' => UploadedFile::fake()->create('report.pdf')->store('hasil-jasa/1', 'local'), 'name' => 'report.pdf'],
        ]]);

        $this->actingAs($this->customer)->patch(route('customer.pengajuan.jasa.confirm', $p->id))->assertSessionHasNoErrors();

        $p->refresh();
        $this->assertSame('Selesai', $p->status);
        $this->assertNotNull($p->selesai_confirmed_at);
    }

    public function test_customer_requests_revision(): void
    {
        $p = $this->makeOrder(['status' => 'Hasil Diunggah', 'hasil_files' => [['path' => 'a.pdf', 'name' => 'a.pdf']], 'revision_count' => 0]);

        $this->actingAs($this->customer)->patch(route('customer.pengajuan.jasa.revision', $p->id), [
            'catatan' => 'Perlu tambahkan grafik pada halaman 3.',
        ])->assertSessionHasNoErrors();

        $p->refresh();
        $this->assertSame('Dikerjakan', $p->status);
        $this->assertSame(1, (int) $p->revision_count);
    }

    public function test_customer_revision_reaches_limit(): void
    {
        $p = $this->makeOrder(['status' => 'Hasil Diunggah', 'hasil_files' => [['path' => 'b.pdf', 'name' => 'b.pdf']], 'revision_count' => 2]);

        $this->actingAs($this->customer)->patch(route('customer.pengajuan.jasa.revision', $p->id), ['catatan' => 'ketiga'])->assertForbidden();
        $this->assertSame(2, (int) $p->fresh()->revision_count);
    }

    public function test_customer_rates_completed_jasa(): void
    {
        $p = $this->makeOrder(['status' => 'Selesai', 'selesai_confirmed_at' => now()]);

        $this->actingAs($this->customer)->post(route('customer.pengajuan.jasa.rate', $p->id), [
            'rating' => 5,
            'ulasan' => 'Hasil memuaskan, sesuai standar.',
        ])->assertSessionHasNoErrors();

        $p->refresh();
        $this->assertSame(5, (int) $p->rating);
        $this->assertNotNull($p->rating_at);
    }

    public function test_customer_cannot_rate_twice(): void
    {
        $p = $this->makeOrder(['status' => 'Selesai', 'rating' => 5, 'rating_at' => now()]);
        $this->actingAs($this->customer)->post(route('customer.pengajuan.jasa.rate', $p->id), ['rating' => 3])->assertForbidden();
    }

    public function test_rating_validation(): void
    {
        $p = $this->makeOrder(['status' => 'Selesai']);
        $this->actingAs($this->customer)->post(route('customer.pengajuan.jasa.rate', $p->id), ['rating' => 6])->assertSessionHasErrors('rating');
        $this->actingAs($this->customer)->post(route('customer.pengajuan.jasa.rate', $p->id), ['rating' => 0])->assertSessionHasErrors('rating');
        $this->assertNull($p->fresh()->rating);
    }

    // ========== Izin & unduhan ==========

    public function test_customer_downloads_result_file(): void
    {
        Storage::fake('local');
        $path = UploadedFile::fake()->create('laporan.pdf')->store('hasil-jasa/1', 'local');
        $p = $this->makeOrder(['status' => 'Hasil Diunggah', 'hasil_files' => [
            ['path' => $path, 'name' => 'laporan.pdf', 'size' => 1024],
        ]]);

        $this->actingAs($this->customer)->get(route('hasil-jasa.download', ['pengajuan' => $p->id, 'index' => 0]))->assertOk();
    }

    public function test_pengelola_owner_downloads_hasil(): void
    {
        Storage::fake('local');
        $path = UploadedFile::fake()->create('hasil.pdf')->store('hasil-jasa/2', 'local');
        $p = $this->makeOrder(['status' => 'Hasil Diunggah', 'hasil_files' => [['path' => $path, 'name' => 'hasil.pdf']]]);

        $this->actingAs($this->pengelola)->get(route('hasil-jasa.download', ['pengajuan' => $p->id, 'index' => 0]))->assertOk();
    }

    public function test_other_customer_cannot_download(): void
    {
        Storage::fake('local');
        $path = UploadedFile::fake()->create('x.pdf')->store('hasil-jasa/3', 'local');
        $p = $this->makeOrder(['status' => 'Hasil Diunggah', 'hasil_files' => [['path' => $path, 'name' => 'x.pdf']]]);

        $other = User::factory()->customer()->create();
        $this->actingAs($other)->get(route('hasil-jasa.download', ['pengajuan' => $p->id, 'index' => 0]))->assertForbidden();
    }

    public function test_admin_rtpu_downloads_hasil(): void
    {
        Storage::fake('local');
        $path = UploadedFile::fake()->create('report.docx')->store('hasil-jasa/4', 'local');
        $p = $this->makeOrder(['status' => 'Selesai', 'hasil_files' => [['path' => $path, 'name' => 'report.docx']]]);

        $this->actingAs($this->admin_rtpu)->get(route('hasil-jasa.download', ['pengajuan' => $p->id, 'index' => 0]))->assertOk();
    }

    public function test_transition_respects_workflow(): void
    {
        $p = $this->makeOrder();
        $this->actingAs($this->pengelola)->patch(route('pengelola.pesanan.update', $p->id), ['status' => 'Hasil Diunggah'])->assertSessionHasErrors();

        $this->assertSame('Lunas', $p->fresh()->status);
    }
}

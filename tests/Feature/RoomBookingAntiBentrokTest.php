<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\RoomBooking;
use App\Models\User;
use App\Services\RoomBookingService;
use Carbon\Carbon;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\SettingSeeder;
use Database\Seeders\TaxRateSeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class RoomBookingAntiBentrokTest extends TestCase
{
    use RefreshDatabase;

    protected User $customer;

    protected Product $roomProduct;

    protected Pengajuan $pengajuan1;

    protected Pengajuan $pengajuan2;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(ProductCategorySeeder::class);
        $this->seed(SettingSeeder::class);
        $this->seed(TaxRateSeeder::class);
        $this->seed(UsecaseSeeder::class);

        $this->customer = User::factory()->create(['role' => 'customer']);
        $cat = ProductCategory::where('slug', 'sewa-ruang-gedung')->first() ?? ProductCategory::first();

        $this->roomProduct = Product::create([
            'owner_id' => $this->customer->id,
            'category_id' => $cat->id,
            'name' => 'Auditorium Lantai 3',
            'slug' => 'auditorium-lt-3',
            'base_price' => 1500000,
            'final_price' => 1500000,
            'stock' => 1,
            'is_active' => true,
            'curation_status' => 'approved',
        ]);

        $this->pengajuan1 = Pengajuan::create([
            'code' => 'PNJ-ROOM-001',
            'buyer_id' => $this->customer->id,
            'product_id' => $this->roomProduct->id,
            'tipe' => 'ruangan',
            'keperluan' => 'Seminar Nasional',
            'jumlah' => 1,
            'status' => 'Diajukan',
        ]);

        $this->pengajuan2 = Pengajuan::create([
            'code' => 'PNJ-ROOM-002',
            'buyer_id' => $this->customer->id,
            'product_id' => $this->roomProduct->id,
            'tipe' => 'ruangan',
            'keperluan' => 'Workshop PBL',
            'jumlah' => 1,
            'status' => 'Diajukan',
        ]);
    }

    public function test_room_booking_reserves_slot_successfully(): void
    {
        $service = new RoomBookingService;
        $start = Carbon::parse('2026-11-10 08:00:00+07:00');
        $end = Carbon::parse('2026-11-10 12:00:00+07:00');

        $booking = $service->reserve(
            $this->roomProduct->id,
            $this->pengajuan1->id,
            $start,
            $end
        );

        $this->assertInstanceOf(RoomBooking::class, $booking);
        $this->assertSame('ACTIVE', $booking->status);
        $this->assertDatabaseHas('room_bookings', [
            'id' => $booking->id,
            'product_id' => $this->roomProduct->id,
            'status' => 'ACTIVE',
        ]);
    }

    public function test_overlapping_room_booking_is_rejected(): void
    {
        $service = new RoomBookingService;
        $start1 = Carbon::parse('2026-11-10 08:00:00+07:00');
        $end1 = Carbon::parse('2026-11-10 12:00:00+07:00');

        $service->reserve($this->roomProduct->id, $this->pengajuan1->id, $start1, $end1);

        // Attempt overlapping reservation on the same product (10:00 - 14:00)
        $start2 = Carbon::parse('2026-11-10 10:00:00+07:00');
        $end2 = Carbon::parse('2026-11-10 14:00:00+07:00');

        $this->expectException(ValidationException::class);
        $service->reserve($this->roomProduct->id, $this->pengajuan2->id, $start2, $end2);
    }

    public function test_released_booking_allows_new_reservation(): void
    {
        $service = new RoomBookingService;
        $start = Carbon::parse('2026-11-12 09:00:00+07:00');
        $end = Carbon::parse('2026-11-12 11:00:00+07:00');

        $service->reserve($this->roomProduct->id, $this->pengajuan1->id, $start, $end);

        // Release first booking (e.g. order cancelled)
        $releasedCount = $service->releaseForPengajuan($this->pengajuan1->id);
        $this->assertSame(1, $releasedCount);

        // Now pengajuan2 can reserve the exact same slot without conflict
        $secondBooking = $service->reserve($this->roomProduct->id, $this->pengajuan2->id, $start, $end);
        $this->assertInstanceOf(RoomBooking::class, $secondBooking);
        $this->assertSame('ACTIVE', $secondBooking->status);
    }
}

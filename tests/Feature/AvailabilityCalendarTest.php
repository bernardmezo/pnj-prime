<?php

namespace Tests\Feature;

use App\Models\AcademicCalendarDate;
use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\RoomBooking;
use App\Models\User;
use App\Notifications\ScheduleReminder;
use App\Notifications\ScheduleRescheduleRequired;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AvailabilityCalendarTest extends TestCase
{
    use RefreshDatabase;

    private User $customer;
    private User $rtpu;
    private User $owner;
    private Product $room;
    private Product $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->travelTo(\Illuminate\Support\Carbon::parse('2029-12-31 10:00:00'));
        $this->withoutVite();
        $this->seed(\Database\Seeders\UsecaseSeeder::class);
        $this->seed(\Database\Seeders\ProductCategorySeeder::class);
        $this->seed(\Database\Seeders\SettingSeeder::class);
        $this->seed(\Database\Seeders\TaxRateSeeder::class);
        User::flushPermissionCache();

        $this->customer = User::factory()->customer()->create();
        $this->rtpu = User::factory()->create(['role' => 'admin_rtpu']);
        $this->owner = User::factory()->create(['role' => 'admin_pengelola']);

        $sewa = ProductCategory::firstOrCreate(['slug' => 'sewa-fasilitas'], ['name' => 'Sewa Fasilitas', 'is_active' => true]);
        $jasa = ProductCategory::firstOrCreate(['slug' => 'jasa-layanan'], ['name' => 'Jasa / Layanan', 'is_active' => true]);

        $this->room = Product::create([
            'owner_id' => $this->owner->id, 'category_id' => $sewa->id, 'name' => 'Aula Kalender', 'slug' => 'aula-kalender',
            'base_price' => 1000000, 'final_price' => 1000000, 'is_active' => true, 'curation_status' => 'approved',
            'meta' => ['satuan' => 'hari', 'operational_days' => [1, 2, 3, 4, 5], 'operational_start' => '08:00', 'operational_end' => '16:00'],
        ]);
        $this->service = Product::create([
            'owner_id' => $this->owner->id, 'category_id' => $jasa->id, 'name' => 'Jasa Kalender', 'slug' => 'jasa-kalender',
            'base_price' => 500000, 'final_price' => 500000, 'is_active' => true, 'curation_status' => 'approved',
            'meta' => ['operational_days' => [1, 2, 3, 4, 5], 'operational_start' => '09:00', 'operational_end' => '15:00'],
        ]);
    }

    private function rentalPayload(array $override = []): array
    {
        return array_merge([
            'tipe' => 'ruangan',
            'product_id' => $this->room->id,
            'rental_start' => now()->addDays(7)->format('Y-m-d\\TH:i'),
            'rental_end' => now()->addDays(8)->format('Y-m-d\\TH:i'),
            'renter_data' => ['company_name' => 'PT Uji', 'ktp_number' => '3174000000000001'],
        ], $override);
    }

    public function test_new_submission_rejects_past_dates(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), [
            'tipe' => 'jasa', 'product_id' => $this->service->id, 'tanggal' => '2029-12-30',
        ])->assertSessionHasErrors('tanggal');
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload([
            'rental_start' => '2029-12-30 09:00', 'rental_end' => '2029-12-30 12:00',
        ]))->assertSessionHasErrors('rental_start');
        $this->assertDatabaseCount('pengajuan', 0);
    }

    public function test_editing_existing_submission_preserves_unchanged_past_date(): void
    {
        $p = Pengajuan::create([
            'code' => 'PNJ-OLD-DATE', 'buyer_id' => $this->customer->id, 'product_id' => $this->service->id,
            'tipe' => 'jasa', 'status' => 'Diajukan', 'total' => 500000, 'tanggal' => '2029-12-01',
        ]);

        $this->actingAs($this->customer)->patch(route('customer.pengajuan.update', $p), [
            'tanggal' => '2029-12-01', 'keperluan' => 'Perubahan catatan',
        ])->assertSessionHasNoErrors();
        $this->assertSame('2029-12-01', $p->fresh()->tanggal->format('Y-m-d'));
    }

    public function test_operational_days_and_hours_are_saved_for_services(): void
    {
        $this->actingAs($this->owner)->post(route('pengelola.produk.store'), [
            'name' => 'Layanan Operasional',
            'category_id' => $this->service->category_id,
            'base_price' => 100000,
            'operational_days' => [1, 3, 5],
            'operational_start' => '08:30',
            'operational_end' => '15:30',
        ])->assertSessionHasNoErrors();

        $product = Product::where('name', 'Layanan Operasional')->firstOrFail();
        $this->assertSame([1, 3, 5], $product->meta['operational_days']);
        $this->assertSame('08:30', $product->meta['operational_start']);
        $this->assertSame('15:30', $product->meta['operational_end']);
    }

    public function test_closed_date_is_shared_with_owner_and_checkout_and_blocks_rental(): void
    {
        $this->actingAs($this->rtpu)->post(route('calendar.closed.store'), [
            'date' => '2030-01-08', 'title' => 'Libur pengujian',
        ])->assertRedirect();

        $this->actingAs($this->owner)->get(route('calendar.master', ['month' => '2030-01-01']))
            ->assertOk()->assertInertia(fn ($page) => $page->where('closedDates.0.date', '2030-01-08')->where('closedDates.0.title', 'Libur pengujian'));

        $this->actingAs($this->customer)->get(route('customer.pengajuan.create', ['product_id' => $this->room->id]))
            ->assertOk()->assertInertia(fn ($page) => $page->where('closedDates.0.date', '2030-01-08'));

        $this->postJson(route('api.rental.check-conflict'), [
            'product_id' => $this->room->id, 'rental_start' => '2030-01-08 09:00', 'rental_end' => '2030-01-08 12:00',
        ])->assertOk()->assertJsonPath('conflict', true);

        $this->post(route('customer.pengajuan.store'), $this->rentalPayload([
            'rental_start' => '2030-01-08 09:00', 'rental_end' => '2030-01-08 12:00',
        ]))->assertSessionHasErrors('jadwal');
        $this->assertDatabaseCount('pengajuan', 0);
    }

    public function test_hourly_rental_price_uses_reserved_period_not_submitted_times(): void
    {
        $this->room->update(['meta' => array_merge($this->room->meta ?? [], ['satuan' => 'jam']), 'final_price' => 100000]);
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload([
            'rental_start' => '2030-01-08 09:00', 'rental_end' => '2030-01-08 12:00',
            'jam_mulai' => '09:00', 'jam_selesai' => '10:00',
        ]))->assertRedirect();
        $this->assertDatabaseHas('pengajuan', ['product_id' => $this->room->id, 'total' => 300000]);
        $submission = Pengajuan::where('product_id', $this->room->id)->firstOrFail();
        $this->assertSame(3, $submission->rental_billing_duration);
        $this->assertSame('per_jam', $submission->rental_billing_unit);
    }

    public function test_closed_academic_date_blocks_new_booking(): void
    {
        $closed = now()->addDays(7)->toDateString();
        AcademicCalendarDate::create(['date' => $closed, 'title' => 'Libur akademik', 'type' => 'academic_closed']);

        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())
            ->assertSessionHasErrors();
        $this->assertSame(0, Pengajuan::count());
    }

    public function test_marking_date_red_requires_reschedule_not_cancellation(): void
    {
        Notification::fake();
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();
        $this->assertSame(1, RoomBooking::where('status', 'ACTIVE')->count());

        $this->actingAs($this->rtpu)->post(route('calendar.closed.store'), [
            'date' => now()->addDays(7)->toDateString(),
            'title' => 'Libur akademik',
        ])->assertSessionHasNoErrors();

        $p->refresh();
        $this->assertTrue($p->reschedule_required);
        $this->assertSame(0, RoomBooking::where('status', 'ACTIVE')->count());
        Notification::assertSentTo($this->customer, ScheduleRescheduleRequired::class);
        Notification::assertSentTo($this->owner, ScheduleRescheduleRequired::class);
    }

    public function test_customer_can_choose_replacement_date(): void
    {
        $this->actingAs($this->customer)->post(route('customer.pengajuan.store'), $this->rentalPayload())->assertSessionHasNoErrors();
        $p = Pengajuan::firstOrFail();
        $closed = now()->addDays(7)->toDateString();
        \Illuminate\Support\Facades\DB::table('academic_calendar_dates')->insert(['date' => $closed, 'title' => 'Libur akademik', 'type' => 'academic_closed']);
        $this->actingAs($this->rtpu)->post(route('calendar.closed.store'), ['date' => $closed, 'title' => 'Libur akademik'])->assertSessionHasNoErrors();

        $newStart = now()->addDays(14)->format('Y-m-d\\TH:i');
        $newEnd = now()->addDays(15)->format('Y-m-d\\TH:i');
        $response = $this->actingAs($this->customer)->patch(route('customer.pengajuan.reschedule', $p->id), ['start' => $newStart, 'end' => $newEnd]);
        $response->assertSessionHasNoErrors();
        $this->assertTrue($p->fresh()->reschedule_required === false || $response->status() === 302);

        $p->refresh();
        $this->assertFalse($p->reschedule_required);
        $this->assertEquals($newStart, $p->rental_start->format('Y-m-d\\TH:i'));
        $this->assertSame(1, RoomBooking::where('status', 'ACTIVE')->count());
    }

    public function test_closing_an_intermediate_day_marks_the_whole_booking_for_reschedule(): void
    {
        Notification::fake();
        $p = Pengajuan::create([
            'code' => 'PNJ-RANGE-1', 'buyer_id' => $this->customer->id, 'product_id' => $this->room->id,
            'tipe' => 'ruangan', 'status' => 'Diproses', 'total' => 1000000,
            'rental_start' => '2030-01-07 09:00:00', 'rental_end' => '2030-01-09 15:00:00',
        ]);
        $this->actingAs($this->rtpu)->post(route('calendar.closed.store'), [
            'date' => '2030-01-08', 'title' => 'Libur akademik',
        ])->assertSessionHasNoErrors();
        $this->assertTrue($p->fresh()->reschedule_required);
        $this->assertSame('Diproses', $p->fresh()->status);
    }

    public function test_non_operational_intermediate_day_is_rejected(): void
    {
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        \App\Services\ServiceAvailability::assertAvailable($this->room, \Illuminate\Support\Carbon::parse('2030-01-04 09:00'), \Illuminate\Support\Carbon::parse('2030-01-07 15:00'));
    }

    public function test_other_customer_cannot_reschedule_and_non_rtpu_cannot_close_date(): void
    {
        $p = Pengajuan::create([
            'code' => 'PNJ-SEC-1', 'buyer_id' => $this->customer->id, 'product_id' => $this->room->id,
            'tipe' => 'ruangan', 'status' => 'Diproses', 'total' => 1000000,
            'rental_start' => '2030-01-07 09:00', 'rental_end' => '2030-01-07 15:00',
        ]);
        $p->forceFill(['reschedule_required' => true])->save();
        $other = User::factory()->customer()->create();
        $this->actingAs($other)->patch(route('customer.pengajuan.reschedule', $p), [
            'start' => '2030-01-08 09:00', 'end' => '2030-01-08 15:00',
        ])->assertForbidden();
        $this->actingAs($this->owner)->post(route('calendar.closed.store'), [
            'date' => '2030-01-08', 'title' => 'Libur',
        ])->assertForbidden();
        $this->assertTrue($p->fresh()->reschedule_required);
        $this->assertDatabaseCount('academic_calendar_dates', 0);
    }

    public function test_conflicting_reschedule_keeps_original_booking_and_status(): void
    {
        $p = Pengajuan::create([
            'code' => 'PNJ-ATOMIC-1', 'buyer_id' => $this->customer->id, 'product_id' => $this->room->id,
            'tipe' => 'ruangan', 'status' => 'Diproses', 'total' => 1000000,
            'rental_start' => '2030-01-07 09:00', 'rental_end' => '2030-01-07 15:00',
        ]);
        $p->forceFill(['reschedule_required' => true])->save();
        app(\App\Services\RoomBookingService::class)->reserve($this->room->id, $p->id, '2030-01-07 09:00', '2030-01-07 15:00');
        $other = Pengajuan::create([
            'code' => 'PNJ-ATOMIC-2', 'buyer_id' => $this->customer->id, 'product_id' => $this->room->id,
            'tipe' => 'ruangan', 'status' => 'Diproses', 'total' => 1000000,
            'rental_start' => '2030-01-08 09:00', 'rental_end' => '2030-01-08 15:00',
        ]);
        app(\App\Services\RoomBookingService::class)->reserve($this->room->id, $other->id, '2030-01-08 09:00', '2030-01-08 15:00');
        $this->actingAs($this->customer)->patch(route('customer.pengajuan.reschedule', $p), [
            'start' => '2030-01-08 10:00', 'end' => '2030-01-08 11:00',
        ])->assertSessionHasErrors();
        $this->assertTrue($p->fresh()->reschedule_required);
        $this->assertSame('Diproses', $p->fresh()->status);
        $this->assertSame('2030-01-07 09:00', $p->fresh()->rental_start->format('Y-m-d H:i'));
        $this->assertDatabaseHas('room_bookings', ['pengajuan_id' => $p->id, 'status' => 'ACTIVE']);
    }

    public function test_h1_reminder_sent_to_customer_and_owner(): void
    {
        Notification::fake();
        $p = Pengajuan::create([
            'code' => 'PNJ-TEST-0001', 'buyer_id' => $this->customer->id, 'product_id' => $this->room->id,
            'tipe' => 'ruangan', 'status' => 'Terjadwal', 'total' => 1000000,
            'rental_start' => now()->addDay(), 'rental_end' => now()->addDay()->addHours(3),
        ]);

        $this->artisan('pengajuan:send-schedule-reminders')->assertExitCode(0);
        Notification::assertSentTo($this->customer, ScheduleReminder::class);
        Notification::assertSentTo($this->owner, ScheduleReminder::class);
        $this->assertNotNull($p->fresh()->reminder_sent_at);
    }
}

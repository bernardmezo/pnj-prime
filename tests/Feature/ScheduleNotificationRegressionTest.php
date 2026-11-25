<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use App\Models\User;
use App\Notifications\ScheduleReminder;
use App\Notifications\ScheduleRescheduleRequired;
use Illuminate\Console\Scheduling\Schedule;
use Tests\TestCase;

class ScheduleNotificationRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_paid_rental_starts_and_finishes_automatically_from_schedule(): void
    {
        $buyer = User::factory()->customer()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $category = ProductCategory::create(['name' => 'Sewa', 'slug' => 'sewa-fasilitas', 'is_active' => true]);
        $product = Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Lapangan Futsal', 'slug' => 'futsal', 'base_price' => 100, 'final_price' => 100, 'is_active' => true, 'curation_status' => 'approved']);
        $booking = Pengajuan::create([
            'code' => 'AUTO-RENTAL', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'ruangan',
            'status' => 'Lunas', 'total' => 100, 'rental_start' => now()->subHour(), 'rental_end' => now()->addHour(),
        ]);
        $order = \App\Models\Order::create(['order_number' => 'AUTO-RENTAL', 'pengajuan_id' => $booking->id, 'buyer_id' => $buyer->id, 'status' => 'lunas', 'subtotal' => 100, 'tax_amount' => 0, 'total' => 100]);

        $this->artisan('pengajuan:advance-rentals')->assertSuccessful();
        $this->assertSame('Berjalan', $booking->fresh()->status);
        $this->assertSame('diproses', $order->fresh()->status);
        $this->assertNotNull($booking->fresh()->rental_started_at);

        $booking->update(['rental_end' => now()->subMinute()]);
        $this->artisan('pengajuan:advance-rentals')->assertSuccessful();
        $this->assertSame('Selesai', $booking->fresh()->status);
        $this->assertSame('selesai', $order->fresh()->status);
        $this->assertNotNull($order->fresh()->completed_at);
        $this->assertSame(0, \App\Models\RoomBooking::where('pengajuan_id', $booking->id)->where('status', 'ACTIVE')->count());
    }

    public function test_automatic_rental_ignores_upcoming_and_reschedule_required_bookings(): void
    {
        $buyer = User::factory()->customer()->create();
        foreach ([['UPCOMING', now()->addHour(), now()->addHours(2), false], ['RESCHEDULE', now()->subHour(), now()->addHour(), true]] as [$code, $start, $end, $reschedule]) {
            $booking = Pengajuan::create(['code' => $code, 'buyer_id' => $buyer->id, 'tipe' => 'ruangan', 'status' => 'Lunas', 'total' => 100, 'rental_start' => $start, 'rental_end' => $end, 'reschedule_required' => $reschedule]);
            $this->artisan('pengajuan:advance-rentals')->assertSuccessful();
            $this->assertSame('Lunas', $booking->fresh()->status);
        }
    }

    public function test_rental_lifecycle_is_scheduled_every_minute_without_overlap(): void
    {
        $events = collect(app(Schedule::class)->events())->filter(fn ($event) => str_contains($event->command ?? '', 'pengajuan:advance-rentals'));

        $this->assertCount(1, $events);
        $this->assertSame('* * * * *', $events->first()->expression);
        $this->assertTrue($events->first()->withoutOverlapping);
    }

    public function test_missing_recipients_do_not_mark_reminder_as_sent(): void
    {
        Notification::fake();
        $buyer = User::factory()->customer()->create();
        $booking = Pengajuan::create([
            'code' => 'NO-OWNER', 'buyer_id' => $buyer->id, 'tipe' => 'jasa',
            'status' => 'Terjadwal', 'total' => 100, 'jadwal_mulai' => now()->addDay(),
        ]);

        $this->artisan('pengajuan:send-schedule-reminders')->assertExitCode(1);
        $this->assertNull($booking->fresh()->reminder_sent_at);
        Notification::assertNothingSent();
    }

    public function test_reminder_is_sent_only_once_on_repeated_runs(): void
    {
        Notification::fake();
        $buyer = User::factory()->customer()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $category = ProductCategory::create(['name' => 'Jasa', 'slug' => 'jasa-test', 'is_active' => true]);
        $product = Product::create([
            'owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Jasa', 'slug' => 'jasa-test',
            'base_price' => 100, 'final_price' => 100, 'is_active' => true, 'curation_status' => 'approved',
        ]);
        $booking = Pengajuan::create([
            'code' => 'ONCE', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'jasa',
            'status' => 'Terjadwal', 'total' => 100, 'jadwal_mulai' => now()->addDay(),
        ]);

        $this->artisan('pengajuan:send-schedule-reminders')->assertSuccessful();
        $this->artisan('pengajuan:send-schedule-reminders')->assertSuccessful();
        Notification::assertSentToTimes($buyer, ScheduleReminder::class, 1);
        Notification::assertSentToTimes($owner, ScheduleReminder::class, 1);
        $this->assertNotNull($booking->fresh()->reminder_sent_at);
    }

    public function test_reminder_is_scheduled_daily_without_overlap(): void
    {
        $events = collect(app(Schedule::class)->events())->filter(fn ($event) => str_contains($event->command ?? '', 'pengajuan:send-schedule-reminders'));

        $this->assertCount(1, $events);
        $this->assertSame('0 8 * * *', $events->first()->expression);
        $this->assertTrue($events->first()->withoutOverlapping);
    }

    public function test_calendar_notifications_link_each_recipient_to_their_own_page(): void
    {
        $pengajuan = new Pengajuan(['code' => 'TEST-1', 'tipe' => 'jasa']);
        $pengajuan->id = 42;
        $customer = new User(['role' => 'customer']);
        $owner = new User(['role' => 'admin_pengelola']);
        $customer->id = 1;
        $owner->id = 2;
        $pengajuan->buyer_id = 1;

        foreach ([new ScheduleReminder($pengajuan), new ScheduleRescheduleRequired($pengajuan)] as $notification) {
            $this->assertSame(route('customer.pengajuan.show', $pengajuan), $notification->toArray($customer)['url']);
            $this->assertSame(route('pengelola.pesanan.index'), $notification->toArray($owner)['url']);
            $this->assertSame(route('pengelola.pesanan.index'), $notification->toMail($owner)->actionUrl);
        }
    }
}

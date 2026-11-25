<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use App\Notifications\JasaWorkDue;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class JasaScheduleAutomationTest extends TestCase
{
    use RefreshDatabase;

    public function test_paid_due_jasa_starts_once_and_notifies_product_owner(): void
    {
        Notification::fake();
        $this->travelTo(now()->startOfDay()->addHours(12));
        $buyer = User::factory()->customer()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $category = ProductCategory::create(['name' => 'Jasa', 'slug' => 'jasa-layanan', 'is_active' => true]);
        $product = Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Jasa', 'slug' => 'jasa', 'base_price' => 100, 'final_price' => 100, 'is_active' => true, 'curation_status' => 'approved']);
        $p = Pengajuan::create(['code' => 'JASA-AUTO', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'jasa', 'status' => 'Lunas', 'total' => 100, 'tanggal' => now()->subDay()->toDateString(), 'jam_mulai' => '10:00']);
        $p->jasa_auto_start = true;
        $p->jadwal_mulai = now()->subDay()->startOfDay()->addHours(10);
        $p->save();
        $order = $p->order()->create(['order_number' => 'JASA-AUTO', 'buyer_id' => $buyer->id, 'subtotal' => 100, 'total' => 100, 'status' => 'lunas']);

        $this->artisan('pengajuan:advance-jasa')->assertSuccessful();
        $this->artisan('pengajuan:advance-jasa')->assertSuccessful();
        $this->assertSame('Dikerjakan', $p->fresh()->status);
        $this->assertSame('diproses', $order->fresh()->status);
        $this->assertCount(1, $p->fresh()->history);
        Notification::assertSentToTimes($owner, JasaWorkDue::class, 1);
        Notification::assertNotSentTo($buyer, JasaWorkDue::class);
    }

    public function test_legacy_paid_due_jasa_never_starts_automatically(): void
    {
        Notification::fake();
        $buyer = User::factory()->customer()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $category = ProductCategory::create(['name' => 'Jasa', 'slug' => 'jasa-layanan', 'is_active' => true]);
        $product = Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Jasa', 'slug' => 'jasa', 'base_price' => 100, 'final_price' => 100, 'is_active' => true, 'curation_status' => 'approved']);
        $p = Pengajuan::create(['code' => 'LEGACY', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'jasa', 'status' => 'Lunas', 'total' => 100, 'tanggal' => now()->subDay()->toDateString(), 'jam_mulai' => '10:00']);

        $this->artisan('pengajuan:advance-jasa')->assertSuccessful();
        $this->assertSame('Lunas', $p->fresh()->status);
        Notification::assertNothingSent();
    }

    public function test_unpaid_future_and_reschedule_required_are_not_started(): void
    {
        Notification::fake();
        $this->travelTo(now()->startOfDay()->addHours(12));
        $buyer = User::factory()->customer()->create();
        foreach ([['UNPAID', 'Menunggu Pembayaran', '10:00', false], ['FUTURE', 'Lunas', '13:00', false], ['RESCHEDULE', 'Lunas', '10:00', true], ['NO-TIME', 'Lunas', null, false]] as [$code, $status, $time, $reschedule]) {
            $p = Pengajuan::create(['code' => $code, 'buyer_id' => $buyer->id, 'tipe' => 'jasa', 'status' => $status, 'total' => 100, 'tanggal' => now()->toDateString(), 'jam_mulai' => $time, 'reschedule_required' => $reschedule]);
            $p->jasa_auto_start = true;
            $p->jadwal_mulai = $time ? now()->startOfDay()->setTimeFromTimeString($time) : null;
            $p->save();
            $this->artisan('pengajuan:advance-jasa')->assertSuccessful();
            $this->assertSame($status, $p->fresh()->status);
        }
        Notification::assertNothingSent();
    }

    public function test_command_is_scheduled_every_minute_without_overlap(): void
    {
        $events = collect(app(Schedule::class)->events())->filter(fn ($event) => str_contains($event->command ?? '', 'pengajuan:advance-jasa'));
        $this->assertCount(1, $events);
        $this->assertSame('* * * * *', $events->first()->expression);
        $this->assertTrue($events->first()->withoutOverlapping);
    }
}

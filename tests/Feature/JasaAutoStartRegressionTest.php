<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class JasaAutoStartRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\UsecaseSeeder::class);
    }

    private function product(User $owner): Product
    {
        $category = ProductCategory::create(['name' => 'Jasa', 'slug' => 'jasa-test', 'is_active' => true]);
        return Product::create(['owner_id' => $owner->id, 'category_id' => $category->id, 'name' => 'Jasa', 'slug' => 'jasa-test', 'base_price' => 100, 'final_price' => 100, 'is_active' => true, 'curation_status' => 'approved', 'target_audience' => 'publik']);
    }

    public function test_estimate_authorization_validation_and_manual_blocking(): void
    {
        $buyer = User::factory()->customer()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $other = User::factory()->create(['role' => 'admin_pengelola']);
        $product = $this->product($owner);
        $p = Pengajuan::create(['code' => 'AUTO-TEST', 'buyer_id' => $buyer->id, 'product_id' => $product->id, 'tipe' => 'jasa', 'status' => 'Dikerjakan', 'total' => 100]);
        $p->jasa_auto_start = true;
        $p->jadwal_mulai = now()->addDays(2)->startOfDay()->addHours(10);
        $p->save();
        $url = route('pengelola.pesanan.update', $p);
        $this->actingAs($other)->patch($url, ['status' => 'Perkiraan Selesai', 'jadwal_selesai' => now()->addDays(3)->toDateTimeString()])->assertNotFound();
        $this->actingAs($owner)->patch($url, ['status' => 'Perkiraan Selesai'])->assertSessionHasErrors('jadwal_selesai');
        $this->patch($url, ['status' => 'Perkiraan Selesai', 'jadwal_selesai' => now()->toDateTimeString()])->assertSessionHasErrors('jadwal_selesai');
        $this->patch($url, ['status' => 'Perkiraan Selesai', 'jadwal_selesai' => now()->addDays(3)->toDateTimeString()])->assertSessionHasNoErrors();
        $this->assertNotNull($p->fresh()->jadwal_selesai);
        foreach (['Diproses', 'Dijadwalkan', 'Dikerjakan'] as $status) {
            $this->patch($url, ['status' => $status])->assertSessionHasErrors('status');
        }
    }

    public function test_auto_start_edit_recomputes_and_rejects_clearing_schedule(): void
    {
        $buyer = User::factory()->customer()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $product = $this->product($owner);
        $date = now()->addDays(4)->toDateString();
        $this->actingAs($buyer)->post(route('customer.pengajuan.store'), ['tipe' => 'jasa', 'product_id' => $product->id, 'tanggal' => $date, 'jam_mulai' => '10:00'])->assertSessionHasNoErrors();
        $p = Pengajuan::where('buyer_id', $buyer->id)->firstOrFail();
        $this->assertTrue((bool) $p->jasa_auto_start);
        $this->patch(route('customer.pengajuan.update', $p), ['jam_mulai' => '11:30'])->assertSessionHasNoErrors();
        $this->assertSame($date.' 11:30', $p->fresh()->jadwal_mulai->format('Y-m-d H:i'));
        $this->patch(route('customer.pengajuan.update', $p), ['jam_mulai' => null])->assertSessionHasErrors('jam_mulai');
        $this->assertSame($date.' 11:30', $p->fresh()->jadwal_mulai->format('Y-m-d H:i'));
        $this->assertTrue((bool) $p->fresh()->jasa_auto_start);
    }

    public function test_new_unscheduled_jasa_can_follow_manual_fulfillment(): void
    {
        Notification::fake();
        $buyer = User::factory()->customer()->create();
        $owner = User::factory()->create(['role' => 'admin_pengelola']);
        $product = $this->product($owner);
        $this->actingAs($buyer)->post(route('customer.pengajuan.store'), ['tipe' => 'jasa', 'product_id' => $product->id])->assertRedirect()->assertSessionHasNoErrors()->assertRedirectContains('/pengajuan/');
        $p = Pengajuan::where('buyer_id', $buyer->id)->firstOrFail();
        $this->assertFalse((bool) $p->jasa_auto_start);
        $p->status = 'Lunas';
        $p->save();
        $this->actingAs($owner)->patch(route('pengelola.pesanan.update', $p), ['status' => 'Diproses'])->assertSessionHasNoErrors();
        $this->assertSame('Diproses', $p->fresh()->status);
    }
}

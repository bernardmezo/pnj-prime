<?php

namespace Tests\Feature\Console;

use App\Models\Pengajuan;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\User;
use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class ExpireUnpaidPengajuanTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed([ProductCategorySeeder::class, UsecaseSeeder::class]);
    }

    public function test_it_expires_unpaid_pengajuan_past_cutoff(): void
    {
        $user = User::factory()->create(['role' => 'customer']);
        $cat = ProductCategory::first();
        $product = Product::create([
            'owner_id' => $user->id,
            'category_id' => $cat->id,
            'name' => 'Layanan Uji',
            'slug' => 'layanan-uji',
            'base_price' => 100000,
            'final_price' => 100000,
            'type' => 'jasa',
            'is_active' => true,
        ]);

        $stale = Pengajuan::create([
            'code' => 'REQ-STALE-01',
            'buyer_id' => $user->id,
            'product_id' => $product->id,
            'tipe' => 'jasa',
            'keperluan' => 'Uji beban',
            'status' => 'Menunggu Pembayaran',
            'total' => 100000,
        ]);
        // Set updated_at 4 days in the past
        $stale->updated_at = Carbon::now()->subDays(4);
        $stale->save(['timestamps' => false]);

        $fresh = Pengajuan::create([
            'code' => 'REQ-FRESH-01',
            'buyer_id' => $user->id,
            'product_id' => $product->id,
            'tipe' => 'jasa',
            'keperluan' => 'Uji segar',
            'status' => 'Menunggu Pembayaran',
            'total' => 100000,
        ]);

        $this->artisan('pengajuan:expire-unpaid', ['--hours' => 72])
            ->expectsOutput('Berhasil membatalkan 1 pengajuan kedaluwarsa.')
            ->assertExitCode(0);

        $this->assertSame('Dibatalkan', $stale->fresh()->status);
        $this->assertSame('Menunggu Pembayaran', $fresh->fresh()->status);
    }
}

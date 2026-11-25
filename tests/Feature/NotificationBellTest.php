<?php

namespace Tests\Feature;

use App\Models\Pengajuan;
use App\Models\User;
use App\Notifications\ProductPaymentReceived;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationBellTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_fetch_unread_notifications(): void
    {
        $user = User::factory()->create();
        $p = Pengajuan::create([
            'code' => 'TEST-001',
            'buyer_id' => $user->id,
            'product_id' => null,
            'status' => 'Lunas',
            'tipe' => 'produk',
            'jumlah' => 1,
        ]);

        Notification::send($user, new ProductPaymentReceived($p));

        $this->actingAs($user)
            ->get(route('notifications.index'))
            ->assertOk()
            ->assertJsonFragment(['unread_count' => 1])
            ->assertJsonPath('notifications.0.title', 'Pembayaran lunas');
    }

    public function test_user_can_mark_notification_as_read(): void
    {
        $user = User::factory()->create();
        $p = Pengajuan::create([
            'code' => 'TEST-001',
            'buyer_id' => $user->id,
            'product_id' => null,
            'status' => 'Lunas',
            'tipe' => 'produk',
            'jumlah' => 1,
        ]);

        Notification::send($user, new ProductPaymentReceived($p));
        $notification = $user->notifications()->first();

        $this->actingAs($user)
            ->post(route('notifications.read', $notification->id))
            ->assertOk()
            ->assertJsonFragment(['unread_count' => 0]);
    }

    public function test_user_can_mark_all_as_read(): void
    {
        $user = User::factory()->create();
        $p1 = Pengajuan::create([
            'code' => 'TEST-001',
            'buyer_id' => $user->id,
            'product_id' => null,
            'status' => 'Lunas',
            'tipe' => 'produk',
            'jumlah' => 1,
        ]);
        $p2 = Pengajuan::create([
            'code' => 'TEST-002',
            'buyer_id' => $user->id,
            'product_id' => null,
            'status' => 'Lunas',
            'tipe' => 'produk',
            'jumlah' => 1,
        ]);

        Notification::send($user, new ProductPaymentReceived($p1));
        Notification::send($user, new ProductPaymentReceived($p2));

        $response = $this->actingAs($user)->post(route('notifications.read-all'));
        $response->assertRedirect();
        $this->assertEquals(0, $user->fresh()->unreadNotifications()->count());
    }
}

<?php

namespace Tests\Feature;

use App\Models\PasswordResetOtp;
use App\Models\User;
use App\Notifications\PasswordResetOtpNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class OtpPasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_page_loads(): void
    {
        $response = $this->get(route('password.request'));
        $response->assertOk();
        $response->assertInertia(fn ($page) => $page->component('Auth/ForgotPassword'));
    }

    public function test_user_can_request_otp_and_otp_is_stored(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'user@test.com']);

        $response = $this->post(route('password.email'), ['email' => 'user@test.com']);
        $response->assertRedirect();
        $response->assertSessionHas('status', 'otp-sent');

        $this->assertDatabaseHas('password_reset_otps', [
            'email' => 'user@test.com',
        ]);

        Notification::assertSentTo($user, PasswordResetOtpNotification::class);
    }

    public function test_otp_expires_after_10_minutes(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'user@test.com']);

        $this->post(route('password.email'), ['email' => 'user@test.com']);

        $otp = PasswordResetOtp::where('email', 'user@test.com')->first();
        $this->assertNotNull($otp);
        $this->assertTrue($otp->expires_at->isFuture());
    }

    public function test_user_can_reset_password_with_valid_otp(): void
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'user@test.com', 'password' => 'OldPassword123!']);

        $this->post(route('password.email'), ['email' => 'user@test.com']);
        $otp = PasswordResetOtp::where('email', 'user@test.com')->first();

        $response = $this->post(route('password.store.otp'), [
            'email' => 'user@test.com',
            'otp' => $otp->otp,
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ]);

        $response->assertRedirect(route('login'));
        $this->assertTrue(password_verify('NewPassword123!', $user->fresh()->password));
        $this->assertNotNull($otp->fresh()->used_at);
    }

    public function test_invalid_otp_is_rejected(): void
    {
        $user = User::factory()->create(['email' => 'user@test.com']);

        $response = $this->post(route('password.store.otp'), [
            'email' => 'user@test.com',
            'otp' => '999999',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertSessionHasErrors('otp');
    }

    public function test_expired_otp_is_rejected(): void
    {
        $user = User::factory()->create(['email' => 'user@test.com']);
        PasswordResetOtp::create([
            'email' => 'user@test.com',
            'otp' => '123456',
            'expires_at' => now()->subMinute(),
        ]);

        $response = $this->post(route('password.store.otp'), [
            'email' => 'user@test.com',
            'otp' => '123456',
            'password' => 'new-password-123',
            'password_confirmation' => 'new-password-123',
        ]);

        $response->assertSessionHasErrors('otp');
    }
}

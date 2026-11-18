<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CheckoutLoginRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_checkout_link_saves_intended_url_then_login_returns_to_checkout(): void
    {
        $checkout = url('/pengajuan/create?product_id=27&tipe=produk');

        $this->get(route('checkout.redirect-login', ['redirect_to' => $checkout]))
            ->assertRedirect(route('login'))
            ->assertSessionHas('_intended_url', $checkout);

        $user = User::factory()->customer()->create(['password' => bcrypt('secret-pass-123')]);

        $this->post(route('login'), ['email' => $user->email, 'password' => 'secret-pass-123'])
            ->assertRedirect($checkout);
    }

    public function test_relative_path_is_accepted(): void
    {
        $this->get(route('checkout.redirect-login', ['redirect_to' => '/pengajuan/create?product_id=5&tipe=jasa']))
            ->assertSessionHas('_intended_url', url('/pengajuan/create?product_id=5&tipe=jasa'));
    }

    public function test_external_host_is_rejected_to_prevent_open_redirect(): void
    {
        $this->get(route('checkout.redirect-login', ['redirect_to' => 'https://evil.com/phishing']))
            ->assertRedirect(route('login'))
            ->assertSessionMissing('_intended_url');
    }

    public function test_protocol_relative_url_is_rejected(): void
    {
        $this->get(route('checkout.redirect-login', ['redirect_to' => '//evil.com/phishing']))
            ->assertSessionMissing('_intended_url');
    }

    public function test_missing_target_just_goes_to_login(): void
    {
        $this->get(route('checkout.redirect-login'))
            ->assertRedirect(route('login'))
            ->assertSessionMissing('_intended_url');
    }

    public function test_authenticated_user_is_not_sent_to_login(): void
    {
        $user = User::factory()->customer()->create();

        $this->actingAs($user)
            ->get(route('checkout.redirect-login', ['redirect_to' => '/pengajuan/create']))
            ->assertRedirect();
        $this->assertNotSame(route('login'), $this->app['session.store']->get('url.intended'));
    }
}

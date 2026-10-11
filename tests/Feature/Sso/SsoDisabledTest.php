<?php

namespace Tests\Feature\Sso;

use App\Sso\NullSsoProvider;
use App\Sso\SsoProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

/**
 * Flag OFF (the default). The SSO routes must not exist and the login page
 * must advertise SSO as disabled.
 */
class SsoDisabledTest extends TestCase
{
    use RefreshDatabase;

    public function test_sso_routes_return_404_when_disabled(): void
    {
        $this->assertFalse((bool) config('services.sso.enabled'));

        $this->get('/sso/redirect')->assertNotFound();
        $this->get('/sso/callback')->assertNotFound();
    }

    public function test_login_page_reports_sso_disabled(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('sso_enabled', false));
    }

    public function test_null_provider_fails_loud(): void
    {
        $provider = $this->app->make(SsoProvider::class);

        $this->assertInstanceOf(NullSsoProvider::class, $provider);
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('belum dikonfigurasi');
        $provider->redirectUrl('state');
    }
}

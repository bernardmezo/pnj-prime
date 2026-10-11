<?php

namespace Tests\Feature\Sso;

use App\Models\User;
use App\Sso\SsoProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Support\FakeSsoProvider;
use Tests\TestCase;

/**
 * Flag ON. Uses a fake, test-only provider (no real IdP). Proves the
 * find-or-create Customer path and the staff-account guard.
 */
class SsoEnabledTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        $_ENV['SSO_ENABLED'] = 'true';
        $_SERVER['SSO_ENABLED'] = 'true';
        putenv('SSO_ENABLED=true');

        parent::setUp();

        $this->assertTrue((bool) config('services.sso.enabled'));
    }

    protected function tearDown(): void
    {
        unset($_ENV['SSO_ENABLED'], $_SERVER['SSO_ENABLED']);
        putenv('SSO_ENABLED');

        parent::tearDown();
    }

    private function bindProvider(array $identity): void
    {
        $this->app->instance(SsoProvider::class, new FakeSsoProvider($identity));
    }

    /** Start the handshake and return the `state` the provider echoes back. */
    private function startHandshake(): string
    {
        $response = $this->get('/sso/redirect');
        $response->assertRedirect();

        $query = parse_url($response->headers->get('Location'), PHP_URL_QUERY);
        parse_str((string) $query, $params);

        return (string) ($params['state'] ?? '');
    }

    public function test_routes_exist_and_redirect_starts_handshake(): void
    {
        $this->bindProvider(['name' => 'Siti', 'email' => 'siti@pnj.ac.id']);

        $response = $this->get('/sso/redirect');
        $response->assertRedirectContains('sso.test/authorize');
        $this->assertNotSame('', $this->startHandshake());
    }

    public function test_callback_creates_a_customer_once_then_finds_it(): void
    {
        $this->bindProvider(['name' => 'Siti Rahma', 'email' => 'Siti.Rahma@PNJ.ac.id', 'nim_nip' => '12345']);

        $state = $this->startHandshake();
        $this->get('/sso/callback?state='.urlencode($state).'&code=abc')
            ->assertRedirect(route('dashboard'));

        $this->assertAuthenticated();
        $user = User::where('email', 'siti.rahma@pnj.ac.id')->firstOrFail();
        $this->assertSame('customer', $user->role);
        $this->assertSame('sso_pnj', $user->account_origin);
        $this->assertSame('Siti Rahma', $user->name);
        $this->assertNotNull($user->email_verified_at);
        $this->assertSame(1, User::where('email', 'siti.rahma@pnj.ac.id')->count());

        // Second sign-in finds the SAME account (no duplicate).
        auth()->logout();
        $state = $this->startHandshake();
        $this->get('/sso/callback?state='.urlencode($state).'&code=def')
            ->assertRedirect(route('dashboard'));
        $this->assertSame(1, User::where('email', 'siti.rahma@pnj.ac.id')->count());
    }

    public function test_staff_email_can_never_be_created_or_elevated_via_sso(): void
    {
        $staff = User::factory()->adminP3m()->create(['email' => 'staff.pnj@test.id']);
        $before = User::count();

        // Provider even claims a privileged role — it must be ignored.
        $this->bindProvider([
            'name' => 'Staf PNJ',
            'email' => 'staff.pnj@test.id',
            'role' => 'super_admin',
        ]);

        $state = $this->startHandshake();
        $this->get('/sso/callback?state='.urlencode($state).'&code=xyz')
            ->assertRedirect(route('login'))
            ->assertSessionHasErrors('email');

        $this->assertGuest();
        $this->assertSame($before, User::count());
        $this->assertSame('admin_p3m', $staff->fresh()->role);
    }

    public function test_unknown_staff_email_is_not_precreated(): void
    {
        $before = User::count();

        $this->bindProvider(['name' => 'Bukan Staf', 'email' => 'baru@pnj.ac.id']);
        $state = $this->startHandshake();
        $this->get('/sso/callback?state='.urlencode($state).'&code=q')
            ->assertRedirect(route('dashboard'));

        $created = User::where('email', 'baru@pnj.ac.id')->firstOrFail();
        $this->assertSame('customer', $created->role);
        $this->assertTrue((bool) $created->is_active);
        $this->assertSame($before + 1, User::count());
    }

    public function test_invalid_state_is_rejected(): void
    {
        $this->bindProvider(['name' => 'X', 'email' => 'x@pnj.ac.id']);

        $this->get('/sso/redirect');
        $this->get('/sso/callback?state=wrong&code=abc')->assertStatus(419);
        $this->assertGuest();
    }

    public function test_login_page_reports_sso_enabled(): void
    {
        $this->get('/login')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('sso_enabled', true));
    }
}

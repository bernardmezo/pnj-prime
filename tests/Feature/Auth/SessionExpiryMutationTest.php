<?php

namespace Tests\Feature\Auth;

use Database\Seeders\ProductCategorySeeder;
use Database\Seeders\UsecaseSeeder;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Regression guard for session expiry during an Inertia mutation.
 *
 * A guest PATCH/DELETE hitting an auth-protected route used to get a plain 302
 * to /login. Because an XHR follows a 302 keeping its verb, the browser then
 * replayed e.g. PATCH /login (only GET/HEAD/POST) and surfaced a 405. Inertia
 * requests must instead be answered with a "location visit" so the client does
 * a real GET navigation to the login screen.
 */
class SessionExpiryMutationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutMiddleware(VerifyCsrfToken::class);
        $this->seed([ProductCategorySeeder::class, UsecaseSeeder::class]);
    }

    public function test_guest_inertia_mutation_is_signalled_as_a_location_visit(): void
    {
        $res = $this->patch('/rtpu/verifikasi/layanan/1/approve', [], [
            'X-Inertia' => 'true',
            'X-Requested-With' => 'XMLHttpRequest',
            'Accept' => 'text/html, application/xhtml+xml',
        ]);

        $res->assertStatus(409);
        $this->assertStringContainsString('/login', (string) $res->headers->get('X-Inertia-Location'));
    }

    public function test_guest_inertia_patch_is_not_answered_with_a_login_redirect(): void
    {
        $res = $this->patch('/rtpu/verifikasi/layanan/1/approve', [], [
            'X-Inertia' => 'true',
            'X-Requested-With' => 'XMLHttpRequest',
            'Accept' => 'text/html, application/xhtml+xml',
        ]);

        $this->assertNotSame(302, $res->status());
        $this->assertNotSame(405, $res->status());
    }

    public function test_guest_plain_browser_request_still_redirects_to_login(): void
    {
        $this->get('/rtpu/dashboard')->assertRedirect('/login');
    }
}

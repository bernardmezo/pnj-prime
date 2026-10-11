<?php

namespace Tests\Support;

use App\Sso\SsoProvider;
use Illuminate\Http\Request;

/**
 * Test-only SSO provider. Never shipped in production code; bound into the
 * container by the SSO feature tests.
 */
class FakeSsoProvider implements SsoProvider
{
    public function __construct(
        private array $identity = [],
        private string $baseRedirect = 'https://sso.test/authorize',
    ) {}

    public function redirectUrl(string $state): string
    {
        return $this->baseRedirect.'?state='.urlencode($state);
    }

    public function resolveIdentity(Request $request): array
    {
        return $this->identity;
    }
}

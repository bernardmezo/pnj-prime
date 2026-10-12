<?php

namespace App\Sso;

use Illuminate\Http\Request;
use RuntimeException;

/**
 * Placeholder used until PNJ supplies real SSO endpoints/credentials.
 * Every method throws, so a misconfigured environment fails loudly
 * instead of silently logging anyone in.
 */
class NullSsoProvider implements SsoProvider
{
    public const NOT_CONFIGURED = 'Integrasi SSO PNJ belum dikonfigurasi.';

    public function redirectUrl(string $state): string
    {
        throw new RuntimeException(self::NOT_CONFIGURED);
    }

    public function resolveIdentity(Request $request): array
    {
        throw new RuntimeException(self::NOT_CONFIGURED);
    }
}

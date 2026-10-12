<?php

namespace App\Sso;

use Illuminate\Http\Request;

/**
 * Adapter interface for the PNJ SSO identity provider.
 *
 * An implementation maps whatever the provider returns on the callback
 * (name, email, nim/nip, ...) to a normalized identity array. No real
 * provider ships in this repository — see docs/SSO.md for exactly what
 * PNJ must supply. The default binding is NullSsoProvider, which throws;
 * tests bind a fake implementation.
 */
interface SsoProvider
{
    /**
     * Absolute URL the browser must be sent to to start the handshake.
     */
    public function redirectUrl(string $state): string;

    /**
     * Resolve the authenticated identity from the provider callback.
     *
     * @return array{name?: string, email: string, external_id?: ?string, nim_nip?: ?string}
     */
    public function resolveIdentity(Request $request): array;
}

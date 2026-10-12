# SSO PNJ — Integration Scaffold

Status: **scaffold only. No identity provider is implemented or faked.**
The integration is disabled by default (`SSO_ENABLED=false`), so the
`/sso/redirect` and `/sso/callback` routes are **not registered** and both
return 404.

## What is already in the codebase

| Piece | Location | Behaviour |
|---|---|---|
| Flag + config | `config/services.php` (`sso.*`) | Reads `SSO_ENABLED` (default `false`) plus placeholder credentials. |
| Adapter contract | `app/Sso/SsoProvider.php` | `redirectUrl($state)` + `resolveIdentity(Request)` → `{name, email, external_id, nim_nip}`. |
| Fail-loud placeholder | `app/Sso/NullSsoProvider.php` | Every method throws `Integrasi SSO PNJ belum dikonfigurasi.` |
| Identity mapping | `app/Sso/SsoService.php` | `findOrCreateCustomer()` — find-or-create, **always role `customer`**. |
| Controller | `app/Http/Controllers/Auth/SsoController.php` | `/sso/redirect` starts the handshake; `/sso/callback` logs the Customer in. Validates a session `state` value (419 on mismatch). |
| Routes | `routes/web.php` | Registered only when the flag is on. |
| Shared flag | `HandleInertiaRequests` → `sso_enabled` | Frontend reads it; the button only redirects when `true`. |
| Frontend | `resources/js/lib/sso.js`, `resources/js/Components/SsoButton.jsx` | Neutral notice while disabled. |
| Default binding | `app/Providers/AppServiceProvider.php` | `SsoProvider` → `NullSsoProvider`. |

## What PNJ must provide

1. **Protocol / endpoints**
   - Authorize URL (where we send the browser) and token URL (server-to-server code exchange).
   - If OpenID Connect: the discovery document URL and supported scopes.
   - Logout / single-logout endpoint (if any).
2. **Client credentials**
   - `SSO_PNJ_CLIENT_ID`
   - `SSO_PNJ_CLIENT_SECRET`
3. **Redirect URIs** registered on the PNJ side (exact match):
   - Local: `http://localhost/sso/callback`
   - Staging: `https://<staging-host>/sso/callback`
   - Production: `https://<prod-host>/sso/callback`
4. **Returned attributes** (names and types) for a civitas member:
   - `name` (display name — required)
   - `email` (required; used as the account key)
   - `nim` or `nip` (student / employee number — optional, for display)
   - any role hint the provider sends — **ignored by design** (see below)
5. **Environment values** to set once the above is known:
   ```
   SSO_ENABLED=true
   SSO_PNJ_CLIENT_ID=...
   SSO_PNJ_CLIENT_SECRET=...
   SSO_PNJ_REDIRECT_URI="${APP_URL}/sso/callback"
   SSO_PNJ_ENDPOINT=https://sso.pnj.ac.id
   ```

## How the real provider is implemented (when credentials arrive)

1. Add `app/Sso/PnjSsoProvider.php` implementing `SsoProvider` (redirect URL
   with `state` + PKCE/nonce, code exchange, attribute mapping).
2. Bind it in `AppServiceProvider::register()`:
   ```php
   $this->app->bind(SsoProvider::class, PnjSsoProvider::class);
   ```
3. Nothing else changes — routes, controller, service, and UI already work.

## Staff accounts stay separate (non-negotiable)

- SSO can only ever produce a **role `customer`** account
  (`SsoService::findOrCreateCustomer()` hard-codes it).
- If the incoming email already belongs to a **staff** account
  (`admin_rtpu`, `admin_p3m`, `pimpinan_rtpu`, `direktur`, `super_admin`),
  the service throws `SsoException` and the callback bounces back to the
  login screen with an error. SSO can never create or elevate a staff role.
- Staff accounts are created **only** by Super Admin via **Kelola User**.
- Role hints from the provider are never trusted or persisted.

## Not included (deliberately)

- No "login as anyone" stub, no client secret in the repo, no provider
  simulation in production code. Tests bind a fake provider **inside the
  test suite only**.

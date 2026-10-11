/**
 * PNJ SSO entry point (frontend only).
 *
 * The backend registers `sso.redirect` / `sso.callback` only when
 * SSO_ENABLED is true (config('services.sso.enabled')), and exposes the flag
 * to the frontend as the shared prop `sso_enabled`. This module therefore
 * navigates to the redirect route ONLY when that flag is on; otherwise the
 * caller keeps the neutral "belum diaktifkan" notice.
 */
export function hasSsoRoute(name = 'sso.redirect') {
    try {
        return typeof route === 'function' && route().has(name);
    } catch {
        return false;
    }
}

export function ssoRouteUrl(name = 'sso.redirect') {
    try {
        if (typeof route === 'function' && route().has(name)) {
            return route(name);
        }
    } catch {
        /* no route helper available */
    }
    return null;
}

/**
 * Attempt SSO navigation. Returns true when a redirect was started, false
 * when SSO is disabled (flag off) or no route exists.
 */
export function startSsoLogin(enabled) {
    if (!enabled) {
        return false;
    }

    const url = ssoRouteUrl();
    if (url) {
        window.location.href = url;
        return true;
    }
    return false;
}

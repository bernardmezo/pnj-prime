/**
 * PNJ SSO entry point (frontend only).
 *
 * TODO(backend): wire SSO redirect — no named SSO route exists yet
 * (checked routes/web.php + routes/auth.php). When the backend adds one
 * (e.g. `sso.login`), this function will navigate to it with no UI changes.
 */
export function hasSsoRoute(name = 'sso.login') {
    try {
        return typeof route === 'function' && route().has(name);
    } catch {
        return false;
    }
}

export function ssoRouteUrl(name = 'sso.login') {
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
 * Attempt SSO navigation. Returns true when a redirect was started,
 * false when no SSO route exists (caller shows an inline notice).
 */
export function startSsoLogin() {
    const url = ssoRouteUrl();
    if (url) {
        window.location.href = url;
        return true;
    }
    return false;
}

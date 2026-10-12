import { useEffect } from 'react';
import { roleHome } from '@/lib/roles';
import { href as navHref } from '@/lib/nav';

/**
 * Thin redirect (no UI): /dashboard sends each role to its home page.
 * Customer -> landing (/). Staff roles -> their start page from the role map
 * (preview URL in DEV, real route when the backend provides one).
 *
 * Uses a full browser redirect (never an Inertia visit) with a same-URL
 * guard, so a mistargeted home can never re-trigger this effect in a loop.
 */
export default function Dashboard({ auth }) {
    useEffect(() => {
        const target = navHref(roleHome(auth?.user?.role), {}, auth?.user?.role);
        if (!target || target === '#') return;
        let dest;
        try {
            dest = new URL(target, window.location.origin);
        } catch {
            return;
        }
        const here = window.location.pathname + window.location.search;
        const there = dest.pathname + dest.search;
        if (there === here) return;
        window.location.replace(dest.toString());
    }, []);

    return null;
}

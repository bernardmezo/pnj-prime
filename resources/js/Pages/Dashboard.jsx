import { useEffect } from 'react';
import { router } from '@inertiajs/react';
import { roleHome } from '@/lib/roles';
import { href as navHref } from '@/lib/nav';

/**
 * Thin redirect (no UI): /dashboard sends each role to its home page.
 * Customer -> landing (/). Staff roles -> their start page from the role map
 * (preview URL in DEV, real route when the backend provides one).
 */
export default function Dashboard({ auth }) {
    useEffect(() => {
        const target = navHref(roleHome(auth?.user?.role), {}, auth?.user?.role);
        if (target && target !== '#') {
            router.visit(target, { replace: true });
        }
    }, []);

    return null;
}

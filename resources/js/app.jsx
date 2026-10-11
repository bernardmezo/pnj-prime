import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'PNJ Prime';

function shouldPreview() {
    try {
        return (
            import.meta.env.DEV &&
            new URLSearchParams(window.location.search).has('preview')
        );
    } catch {
        return false;
    }
}

async function boot() {
    const el = document.getElementById('app');
    // DEV-ONLY preview harness (stripped from production builds by the
    // strip-dev-preview vite plugin; see vite.config.js).
    if (shouldPreview()) {
        const { mountPreview } = await import('./dev/harness');
        mountPreview(el);
        return;
    }
    createInertiaApp({
        title: (title) => `${title} - ${appName}`,
        resolve: (name) =>
            resolvePageComponent(
                `./Pages/${name}.jsx`,
                import.meta.glob('./Pages/**/*.jsx'),
            ),
        setup({ el, App, props }) {
            const root = createRoot(el);
            root.render(<App {...props} />);
        },
        progress: {
            color: '#f2b134', // PNJ Prime gold token
        },
    });
}

boot();

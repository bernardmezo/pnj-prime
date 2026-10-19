import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';

const appName = import.meta.env.VITE_APP_NAME || 'PNJ Prime';

// The Dev/UiKit page is a development-only playground: it is resolvable in
// `vite dev` but stripped from production bundles.
const pages = import.meta.env.DEV
    ? import.meta.glob('./Pages/**/*.jsx')
    : import.meta.glob(['./Pages/**/*.jsx', '!./Pages/Dev/**']);

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./Pages/${name}.jsx`, pages),
    setup({ el, App, props }) {
        const root = createRoot(el);
        root.render(<App {...props} />);
    },
    progress: {
        color: '#f2b134', // PNJ Prime gold token
    },
});

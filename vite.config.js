import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

/**
 * strip-dev-preview: the DEV preview harness (resources/js/dev/*) must
 * never ship. During `vite build` only, imports of ./dev/harness from
 * app.jsx resolve to an empty stub, so no harness code, mocks, or
 * preview-only imports end up in the production bundle.
 */
function stripDevPreview() {
    return {
        name: 'strip-dev-preview',
        apply: 'build',
        enforce: 'pre',
        resolveId(source, importer) {
            if (
                importer &&
                importer.replace(/\\/g, '/').endsWith('resources/js/app.jsx') &&
                (source === './dev/harness' || source === './dev/harness.jsx')
            ) {
                return '\0dev-harness-stub';
            }
            return null;
        },
        load(id) {
            if (id === '\0dev-harness-stub') {
                return 'export function mountPreview(){/* stripped: dev harness excluded from production build */}';
            }
            return null;
        },
    };
}

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        stripDevPreview(),
    ],
});

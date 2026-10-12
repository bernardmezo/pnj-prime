/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './resources/**/*.blade.php',
        './resources/**/*.jsx',
        './resources/**/*.js',
    ],

    theme: {
        extend: {
            colors: {
                // Locked landing tokens — use ONLY these on public pages
                bg: 'var(--color-bg)',
                surface: 'var(--color-surface)',
                ink: 'var(--color-ink)',
                muted: 'var(--color-muted)',
                border: 'var(--color-border)',
                accent: {
                    DEFAULT: 'var(--color-accent)',
                    hover: 'var(--color-accent-hover)',
                    tint: 'var(--color-accent-tint)',
                },
                deep: {
                    DEFAULT: 'var(--color-deep)',
                    soft: 'var(--color-deep-soft)',
                },
                gold: {
                    DEFAULT: 'var(--color-gold)',
                    deep: 'var(--color-gold-deep)',
                },
            },

            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['Sora', 'Inter', 'ui-sans-serif', 'sans-serif'],
            },

            borderRadius: {
                xl: '0.875rem',
                '2xl': '1.25rem',
                card: '1.375rem',
            },

            boxShadow: {
                card: '0 1px 3px 0 rgba(6,59,52,0.07), 0 6px 20px -6px rgba(6,59,52,0.12)',
                'card-hover':
                    '0 4px 8px -2px rgba(6,59,52,0.10), 0 18px 44px -12px rgba(6,59,52,0.28)',
                header: '0 4px 20px -6px rgba(6,59,52,0.14)',
            },

            maxWidth: {
                content: '1240px',
            },
        },
    },

    plugins: [require('@tailwindcss/forms')],
};

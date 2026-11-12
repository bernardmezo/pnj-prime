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
                danger: {
                    DEFAULT: 'var(--color-danger)',
                    hover: 'var(--color-danger-hover)',
                    tint: 'var(--color-danger-tint)',
                },
                success: {
                    DEFAULT: 'var(--color-success)',
                    tint: 'var(--color-success-tint)',
                },
                dark: {
                    bg: 'var(--color-dark-bg)',
                    text: 'var(--color-dark-text)',
                    muted: 'var(--color-dark-muted)',
                    border: 'var(--color-dark-border)',
                    hover: 'var(--color-dark-hover)',
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
                card: 'var(--shadow-card)',
                'card-hover': 'var(--shadow-card-hover)',
                header: 'var(--shadow-header)',
                dropdown: 'var(--shadow-dropdown)',
            },

            maxWidth: {
                content: '1240px',
            },
        },
    },

    plugins: [require('@tailwindcss/forms')],
};

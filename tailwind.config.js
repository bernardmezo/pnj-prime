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
                // PNJ Prime brand palette � premium, professional
                prime: {
                    50:  '#f0f4ff',
                    100: '#dce6fd',
                    200: '#b9cdfb',
                    300: '#8aadf7',
                    400: '#5584f0',
                    500: '#2d5fe6',
                    600: '#1e45c9',
                    700: '#1833a3',
                    800: '#182b84',
                    900: '#1a2869',
                    950: '#0f1840',
                },
                gold: {
                    50:  '#fdf9ed',
                    100: '#faefc8',
                    200: '#f5dc8e',
                    300: '#f0c34d',
                    400: '#ecaa23',
                    500: '#e08e0b',
                    600: '#ba6a07',
                    700: '#964a0a',
                    800: '#7b3b10',
                    900: '#663210',
                },
                surface: {
                    DEFAULT: '#ffffff',
                    muted:   '#f8f9fc',
                    subtle:  '#eef1f8',
                    border:  '#dde1ef',
                },
            },

            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['Sora', 'Inter', 'ui-sans-serif', 'sans-serif'],
            },

            borderRadius: {
                xl:  '0.875rem',
                '2xl': '1.25rem',
            },

            boxShadow: {
                card:   '0 1px 4px 0 rgba(15,24,64,0.06), 0 4px 16px 0 rgba(15,24,64,0.08)',
                modal:  '0 8px 40px 0 rgba(15,24,64,0.18)',
                glow:   '0 0 20px 0 rgba(45,95,230,0.25)',
            },

            backgroundImage: {
                'prime-gradient': 'linear-gradient(135deg, #1a2869 0%, #2d5fe6 100%)',
                'gold-gradient':  'linear-gradient(135deg, #e08e0b 0%, #f0c34d 100%)',
            },
        },
    },

    plugins: [
        require('@tailwindcss/forms'),
    ],
};

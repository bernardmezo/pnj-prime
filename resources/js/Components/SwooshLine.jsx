import clsx from 'clsx';

/**
 * SwooshLine — lengkungan abstrak terinspirasi garis keranjang belanja di logo PRIME.
 * Tipis, transparan, dan mudah diatur ukuran/warna/opasitasnya lewat props.
 *
 * Props:
 *   size      'sm' | 'md' | 'lg' — lebar visual (default md)
 *   opacity   0–1 (default 0.15)
 *   color     warna stroke (default var(--color-gold))
 *   stroke    ketebalan garis (default 2)
 *   className
 *
 * Perhatikan `prefers-reduced-motion` — tidak ada animasi.
 */
export default function SwooshLine({
    size = 'md',
    opacity = 0.15,
    color = 'var(--color-gold)',
    stroke = 2,
    className,
}) {
    const widths = { sm: 240, md: 400, lg: 640 };
    const heightRatio = 140 / 400;
    const width = widths[size];
    const height = Math.round(width * heightRatio);

    return (
        <svg
            className={clsx('block h-auto w-full max-w-none', className)}
            width={width}
            height={height}
            viewBox="0 0 400 140"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ opacity }}
        >
            <path
                d="M 20,110 C 60,110 120,60 200,100 C 280,140 360,80 380,120"
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
            />
        </svg>
    );
}

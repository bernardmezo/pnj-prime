import clsx from 'clsx';

/**
 * SpeedLines — motif tiga garis yang memudar dari gold ke teal-hijau,
 * terinspirasi aksen garis logo PRIME.
 *
 * Props:
 *   size      'sm' | 'md' | 'lg' — lebar keseluruhan garis
 *   direction 'horizontal' (default) | 'vertical'
 *
 * Tidak ada animasi berjalan; `prefers-reduced-motion` dihormati secara default.
 */
export default function SpeedLines({ size = 'md', direction = 'horizontal', className }) {
    const widths = {
        sm: ['3rem', '2rem', '1.25rem'],
        md: ['5rem', '3.25rem', '2rem'],
        lg: ['8rem', '5.25rem', '3rem'],
    }[size];

    const lineHeight = size === 'lg' ? '3px' : size === 'md' ? '2px' : '1px';
    const isVertical = direction === 'vertical';

    return (
        <div
            className={clsx(
                'flex',
                isVertical ? 'h-fit flex-col items-start' : 'flex-col items-start',
                className,
            )}
        >
            {widths.map((w, i) => (
                <div
                    key={i}
                    className="rounded-full"
                    style={{
                        [isVertical ? 'height' : 'width']: w,
                        [isVertical ? 'width' : 'height']: lineHeight,
                        [isVertical ? 'marginBottom' : 'marginBottom']:
                            i < widths.length - 1 ? (size === 'lg' ? '0.625rem' : '0.5rem') : undefined,
                        background:
                            i === 0
                                ? 'linear-gradient(to right, var(--color-gradient-start), var(--color-gradient-end))'
                                : i === 1
                                  ? 'linear-gradient(to right, var(--color-gold), var(--color-gradient-end))'
                                  : 'linear-gradient(to right, var(--color-gold), transparent)',
                        opacity: i === 2 ? 0.6 : 1,
                    }}
                />
            ))}
        </div>
    );
}

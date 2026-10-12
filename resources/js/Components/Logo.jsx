import { Link } from '@inertiajs/react';

/**
 * Shared logo component, single source of truth.
 *
 * Logo file: public/assets/logo.PNG (469 x 531 px, ratio 0.88).
 * Ratio < 1.6, so it is treated as a SYMBOL only: the "PNJ Prime" wordmark
 * text is kept beside the image. Flip LOGO_HAS_WORDMARK to true if the file
 * is ever replaced with a full lockup that already contains the wordmark.
 */
export const LOGO_HAS_WORDMARK = false;
export const LOGO_SRC = '/assets/logo.PNG';

export default function Logo({ onDark = false, height = 38 }) {
    const img = (
        <img
            src={LOGO_SRC}
            alt="PNJ Prime"
            style={{ height, width: 'auto', display: 'block' }}
        />
    );

    return (
        <Link href={route('home')} className="flex shrink-0 items-center gap-2.5" aria-label="PNJ Prime, Beranda">
            {onDark ? (
                <span
                    className="flex items-center justify-center"
                    style={{
                        background: 'var(--color-bg)',
                        borderRadius: 12,
                        padding: '8px 10px',
                    }}
                >
                    {img}
                </span>
            ) : (
                img
            )}
            {!LOGO_HAS_WORDMARK && (
                <span>
                    <span
                        className="block font-display text-base font-bold leading-tight"
                        style={{ color: onDark ? 'var(--color-bg)' : 'var(--color-ink)' }}
                    >
                        PNJ Prime
                    </span>
                    <span
                        className="block text-[11px]"
                        style={{ color: onDark ? 'rgba(255,255,255,0.65)' : 'var(--color-muted)' }}
                    >
                        Politeknik Negeri Jakarta
                    </span>
                </span>
            )}
        </Link>
    );
}

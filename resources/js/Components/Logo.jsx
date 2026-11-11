import { Link } from '@inertiajs/react';

/**
 * Shared logo component, single source of truth.
 *
 * Logo file: public/assets/logo.PNG (469 x 531 px, ratio 0.88).
 * Ratio < 1.6, so it is treated as a SYMBOL only: the "PNJ Prime" wordmark
 * text is kept beside the image. Flip LOGO_HAS_WORDMARK to true if the file
 * is ever replaced with a full lockup that already contains the wordmark.
 */
export const LOGO_SRC = '/assets/logo-prime.png';
export const LOGO_SRC_WHITE = '/assets/logo-prime-white.png';
export const LOGO_HAS_WORDMARK = true;

export default function Logo({ onDark = false, height = 34, showText = true }) {
    const src = onDark ? LOGO_SRC_WHITE : LOGO_SRC;

    const img = (
        <img
            src={src}
            alt="PNJ Prime"
            style={{ height, width: 'auto', display: 'block' }}
            className="transition-transform duration-200 group-hover:scale-[1.02]"
        />
    );

    return (
        <Link href={route('home')} className="group flex shrink-0 items-center gap-2.5" aria-label="PNJ Prime, Beranda">
            {img}
            {showText && (
                <div
                    className={`border-l pl-2.5 transition-colors leading-tight ${
                        onDark ? 'border-white/20' : 'border-slate-200'
                    }`}
                >
                    <span
                        className={`block text-[11px] font-bold tracking-wider uppercase ${
                            onDark ? 'text-white' : 'text-[var(--color-accent)]'
                        }`}
                    >
                        PNJ
                    </span>
                    <span
                        className={`block text-[10px] ${
                            onDark ? 'text-white/70' : 'text-[var(--color-muted)]'
                        } mt-0.5`}
                    >
                        Politeknik Negeri Jakarta
                    </span>
                </div>
            )}
        </Link>
    );
}

import { Link } from '@inertiajs/react';

/**
 * Shared logo component, single source of truth.
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
                    className="border-l pl-2.5 leading-tight transition-colors"
                    style={{ borderColor: onDark ? 'var(--color-dark-border)' : 'var(--color-border)' }}
                >
                    <span
                        className="block text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: onDark ? 'var(--color-dark-text)' : 'var(--color-accent)' }}
                    >
                        PNJ
                    </span>
                    <span
                        className="mt-0.5 block text-[10px]"
                        style={{ color: onDark ? 'var(--color-dark-muted)' : 'var(--color-muted)' }}
                    >
                        Politeknik Negeri Jakarta
                    </span>
                </div>
            )}
        </Link>
    );
}

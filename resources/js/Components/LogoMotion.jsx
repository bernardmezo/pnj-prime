import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { LOGO_SRC, LOGO_SRC_WHITE } from '@/Components/Logo';

/**
 * Logo dengan motion reveal + shine, memakai logo PNG yang sudah ada.
 * Bisa dipakai sebagai pengganti <Logo />; struktur dan ukuran sama.
 */
export default function LogoMotion({ onDark = false, height = 34, showText = true }) {
    const reduce = useReducedMotion();
    const src = onDark ? LOGO_SRC_WHITE : LOGO_SRC;

    const img = (
        <span className="relative inline-flex overflow-hidden rounded-md" style={{ height }}>
            <motion.img
                src={src}
                alt="PNJ Prime"
                style={{ height, width: 'auto', display: 'block' }}
                initial={reduce ? false : { clipPath: 'inset(0 100% 0 0)', opacity: 0.25 }}
                animate={{ clipPath: 'inset(0 0% 0 0)', opacity: 1 }}
                transition={{ duration: reduce ? 0 : 0.9, ease: [0.16, 1, 0.3, 1] }}
            />
            {!reduce && (
                <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    initial={{ x: '-130%' }}
                    animate={{ x: '130%' }}
                    transition={{ duration: 0.9, delay: 0.8, ease: 'easeInOut' }}
                    style={{
                        background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.4) 50%, transparent 65%)',
                        mixBlendMode: 'screen',
                    }}
                />
            )}
        </span>
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

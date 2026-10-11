import { motion, useReducedMotion } from 'framer-motion';
import Logo from '@/Components/Logo';
import { EASE } from '@/Components/ui';

/**
 * AuthLayout, quiet split screen. Left: flat deep panel with text only
 * (logo, headline, one-line caption). Right: plain white form column.
 * Keeps title/subtitle props for all auth pages.
 */
export default function AuthLayout({ title, subtitle, children }) {
    const reduce = useReducedMotion();
    return (
        <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
            {/* Left panel */}
            <div
                className="relative hidden w-[46%] shrink-0 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12"
                style={{ background: 'var(--color-deep)' }}
            >
                <div className="relative">
                    <Logo onDark />
                </div>
                <div className="relative">
                    <p className="mb-4 font-mono text-xs font-medium uppercase tracking-[0.18em] text-white/60">
                        Akses PNJ Prime
                    </p>
                    <p className="font-display font-bold leading-[1.04] text-white" style={{ fontSize: 'clamp(36px, 3.6vw, 56px)', letterSpacing: '-0.02em' }}>
                        Satu akun untuk
                        <br />
                        inovasi PNJ.
                    </p>
                    <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-white/65">
                        Masuk untuk memesan produk, jasa pengujian, dan fasilitas
                        terkurasi, pembayaran ke rekening resmi PNJ.
                    </p>
                </div>
                <p className="relative text-xs text-white/40">© 2026 PNJ Prime, UPA RTPU Politeknik Negeri Jakarta</p>
            </div>

            {/* Right panel */}
            <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10" style={{ background: 'var(--color-bg)' }}>
                <motion.div
                    className="w-full max-w-md"
                    initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                >
                    <div className="mb-8 lg:hidden">
                        <Logo />
                    </div>
                    <h1 className="font-display font-bold" style={{ color: 'var(--color-ink)', fontSize: 'clamp(30px, 4vw, 40px)', letterSpacing: '-0.02em', lineHeight: 1.05 }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                            {subtitle}
                        </p>
                    )}
                    <div className="mt-8">{children}</div>
                </motion.div>
            </div>
        </div>
    );
}

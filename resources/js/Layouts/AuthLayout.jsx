import { motion, useReducedMotion } from 'framer-motion';
import { Package } from 'lucide-react';
import Logo from '@/Components/Logo';
import { EASE } from '@/Components/ui';

/**
 * AuthLayout — single auth experience. Left: dark-teal gradient panel with
 * logo (on white tile), tagline, grid-pattern placeholder art + soft ambient
 * glow. Right: white form card. Calm motion; glow static under
 * prefers-reduced-motion.
 */
export default function AuthLayout({ title, subtitle, children }) {
    const reduce = useReducedMotion();
    return (
        <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
            {/* Left panel */}
            <div
                className="relative hidden w-[44%] shrink-0 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10"
                style={{
                    background:
                        'linear-gradient(140deg, var(--color-deep) 0%, var(--color-deep-soft) 60%, var(--color-accent-hover) 130%)',
                }}
            >
                <div className="grid-pattern absolute inset-0" />
                {!reduce ? (
                    <motion.div
                        aria-hidden
                        className="pointer-events-none absolute -bottom-24 -right-24 h-[380px] w-[380px] rounded-full"
                        style={{ background: 'radial-gradient(circle, rgba(242,177,52,0.22), transparent 70%)' }}
                        animate={{ x: [0, -20, 0], y: [0, 20, 0] }}
                        transition={{ duration: 15, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                    />
                ) : (
                    <div aria-hidden className="pointer-events-none absolute -bottom-24 -right-24 h-[380px] w-[380px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(242,177,52,0.22), transparent 70%)' }} />
                )}
                <div className="relative">
                    <Logo onDark />
                </div>
                <div className="relative">
                    <div
                        className="mb-6 flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-3xl border border-white/15"
                        role="img"
                        aria-label="Ilustrasi inovasi PNJ Prime"
                    >
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))' }} />
                        <span
                            className="relative flex h-16 w-16 items-center justify-center rounded-3xl"
                            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.22)' }}
                        >
                            <Package className="h-8 w-8 text-white" />
                        </span>
                    </div>
                    <p className="font-display text-2xl font-bold leading-snug text-white">
                        Hilirisasi inovasi PNJ untuk Indonesia.
                    </p>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">
                        Masuk untuk mengelola pengajuan, kurasi, transaksi, dan pesanan Anda dalam satu tempat yang aman.
                    </p>
                </div>
                <p className="relative text-xs text-white/50">© 2026 PNJ Prime — UPA RTPU Politeknik Negeri Jakarta</p>
            </div>

            {/* Right panel */}
            <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8" style={{ background: 'var(--color-bg)' }}>
                <motion.div
                    className="w-full max-w-md"
                    initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                >
                    <div className="mb-6 lg:hidden">
                        <Logo />
                    </div>
                    <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-ink)' }}>
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
                            {subtitle}
                        </p>
                    )}
                    <div
                        className="mt-6 rounded-[22px] border bg-white p-6 sm:p-8"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        {children}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

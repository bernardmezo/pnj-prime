import { motion, useReducedMotion } from 'framer-motion';
import FlashToast from '@/Components/FlashToast';
import LogoMotion from '@/Components/LogoMotion';
import SpeedLines from '@/Components/SpeedLines';
import SwooshLine from '@/Components/SwooshLine';
import { EASE } from '@/Components/ui';

/**
 * AuthLayout, quiet split screen. Left: deep teal brand panel with logo,
 * headline, caption, dan motif SpeedLines/SwooshLine. Right: clean form card.
 * Keeps title/subtitle props for all auth pages.
 */
export default function AuthLayout({ title, subtitle, children }) {
    const reduce = useReducedMotion();
    return (
        <div className="flex min-h-screen" style={{ background: 'var(--color-bg)' }}>
            {/* Left panel */}
            <div
                className="relative hidden w-[46%] shrink-0 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-12"
                style={{ background: 'linear-gradient(155deg, var(--color-deep) 0%, var(--color-deep-soft) 65%, var(--color-accent-hover) 135%)' }}
            >
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        background:
                            'radial-gradient(circle at 80% 10%, color-mix(in srgb, var(--color-gold) 22%, transparent), transparent 50%), radial-gradient(circle at 10% 90%, color-mix(in srgb, var(--color-dark-text) 12%, transparent), transparent 55%)',
                    }}
                    aria-hidden
                />
                <div className="pointer-events-none absolute -left-24 top-16 w-[520px] opacity-25" aria-hidden>
                    <SwooshLine size="lg" opacity={1} color="var(--color-gold)" stroke={1.5} />
                </div>
                <div className="pointer-events-none absolute bottom-20 right-14" aria-hidden>
                    <SpeedLines size="md" />
                </div>
                <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.08]" aria-hidden>
                    <SwooshLine size="xl" opacity={1} color="var(--color-gold)" stroke={2} />
                </div>

                <div className="relative">
                    <LogoMotion onDark height={42} />
                </div>
                <div className="relative max-w-lg">
                    <p className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 font-mono text-xs font-medium uppercase tracking-[0.18em]" style={{ borderColor: 'var(--color-dark-border)', color: 'var(--color-dark-muted)', background: 'color-mix(in srgb, var(--color-dark-text) 8%, transparent)' }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-gold)' }} />
                        Akses PNJ Prime
                    </p>
                    <p className="font-display font-bold leading-[1.04] text-white" style={{ fontSize: 'clamp(36px, 3.6vw, 56px)', letterSpacing: '-0.02em' }}>
                        Satu akun untuk
                        <br />
                        inovasi <span style={{ color: 'var(--color-gold)' }}>PNJ</span>.
                    </p>
                    <p className="mt-5 max-w-sm text-[15px] leading-relaxed" style={{ color: 'var(--color-dark-muted)' }}>
                        Masuk untuk memesan produk, jasa pengujian, dan fasilitas
                        terkurasi, pembayaran ke rekening resmi PNJ.
                    </p>
                </div>
                <p className="relative text-xs" style={{ color: 'var(--color-dark-muted)' }}>© 2026 PNJ Prime, UPA RTPU Politeknik Negeri Jakarta</p>
            </div>

            {/* Right panel */}
            <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10" style={{ background: 'var(--color-bg)' }}>
                <motion.div
                    className="w-full max-w-[440px]"
                    initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                >
                    <div className="mb-8 lg:hidden">
                        <LogoMotion />
                    </div>
                    <div
                        className="relative overflow-hidden rounded-[28px] border bg-white p-6 shadow-layered sm:p-8"
                        style={{ borderColor: 'var(--color-border)' }}
                    >
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[var(--color-gold)] via-[var(--color-accent)] to-[var(--color-gold)]" aria-hidden />
                        <h1 className="font-display font-bold" style={{ color: 'var(--color-ink)', fontSize: 'clamp(28px, 4vw, 34px)', letterSpacing: '-0.02em', lineHeight: 1.08 }}>
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-2.5 max-w-sm text-[15px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                                {subtitle}
                            </p>
                        )}
                        <div className="mt-8">{children}</div>
                    </div>
                </motion.div>
            </div>
            <FlashToast />
        </div>
    );
}

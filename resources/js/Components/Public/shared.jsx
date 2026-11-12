import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export const EASE = [0.22, 1, 0.36, 1];

export function Reveal({ children, delay = 0, className = '', y = 24 }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y: reduce ? 0 : y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : delay, ease: EASE }}
        >
            {children}
        </motion.div>
    );
}

export function StatCounter({ value, suffix = '', className = '' }) {
    const reduce = useReducedMotion();
    const ref = useRef(null);
    const [n, setN] = useState(0);
    const started = useRef(false);

    useEffect(() => {
        if (reduce) {
            setN(value);
            return;
        }
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !started.current) {
                    started.current = true;
                    const t0 = performance.now();
                    const dur = 1400;
                    const tick = (t) => {
                        const p = Math.min((t - t0) / dur, 1);
                        const eased = 1 - Math.pow(1 - p, 3);
                        setN(Math.round(eased * value));
                        if (p < 1) requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                }
            },
            { threshold: 0.4 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [value, reduce]);

    return (
        <span ref={ref} className={className}>
            {n}
            {suffix}
        </span>
    );
}

export function VisualPlaceholder({ icon: Icon, image, alt = '', variant = 'light', className = '' }) {
    const dark = variant === 'dark';
    return (
        <div
            className={`relative flex items-center justify-center overflow-hidden ${className}`}
            style={{
                background: dark
                    ? 'linear-gradient(135deg, var(--color-deep-soft) 0%, var(--color-deep) 60%, var(--color-accent-hover) 140%)'
                    : 'linear-gradient(135deg, var(--color-accent-tint) 0%, var(--color-bg) 55%, var(--color-accent-tint) 130%)',
            }}
            aria-hidden={alt ? undefined : true}
            role={alt ? 'img' : undefined}
            aria-label={alt || undefined}
        >
            <div className={`absolute inset-0 ${dark ? 'grid-pattern' : 'dot-pattern-dark'}`} />
            <div
                className="absolute -right-10 -top-10 h-44 w-44 rounded-full"
                style={{
                    background: dark
                        ? 'radial-gradient(circle, color-mix(in srgb, var(--color-gold) 28%, transparent), transparent 70%)'
                        : 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 22%, transparent), transparent 70%)',
                }}
            />
            <div
                className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full"
                style={{
                    background: dark
                        ? 'radial-gradient(circle, color-mix(in srgb, var(--color-dark-text) 16%, transparent), transparent 70%)'
                        : 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 14%, transparent), transparent 70%)',
                }}
            />
            <div
                className="absolute inset-0"
                style={{
                    boxShadow: dark
                        ? 'inset 0 0 80px color-mix(in srgb, var(--color-dark-text) 8%, transparent)'
                        : 'inset 0 0 60px color-mix(in srgb, var(--color-deep) 8%, transparent)',
                }}
            />
            {Icon && (
                <span
                    className="relative flex h-20 w-20 items-center justify-center rounded-3xl"
                    style={{
                        background: dark ? 'color-mix(in srgb, var(--color-dark-text) 12%, transparent)' : 'var(--color-bg)',
                        border: dark
                            ? '1px solid var(--color-dark-border)'
                            : '1px solid var(--color-border)',
                        boxShadow: dark
                            ? 'var(--shadow-hero)'
                            : 'var(--shadow-card)',
                    }}
                >
                    <Icon
                        className="h-9 w-9"
                        style={{ color: dark ? 'var(--color-dark-text)' : 'var(--color-accent)' }}
                    />
                </span>
            )}
            {image && (
                <img
                    src={image}
                    alt={alt}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            )}
        </div>
    );
}

import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export const EASE = [0.22, 1, 0.36, 1];

/* ---------- Roles: delegated to lib/roles.js (single source of truth) ---------- */
import {
    MENUS as LIB_MENUS,
    ROLE_LABELS as LIB_LABELS,
    isStaffRole,
    menuForRole as libMenuForRole,
    normalizeRole as libNormalize,
    roleLabel as libRoleLabel,
} from '@/lib/roles';

// Legacy names kept working for older kept pages.
export const NORMALIZED_ROLES = ['customer', 'admin_p3m', 'admin_rtpu', 'super_admin', 'pimpinan_rtpu', 'direktur'];
export const normalizeRole = libNormalize;
export const ROLE_LABELS = LIB_LABELS;
export const roleLabel = libRoleLabel;
export const isInternalRole = isStaffRole;
export const MENU_BY_ROLE = {
    admin_rtpu: LIB_MENUS.admin_rtpu.map((m) => ({ label: m.label, href: m.page, icon: m.icon })),
    super_admin: LIB_MENUS.super_admin.map((m) => ({ label: m.label, href: m.page, icon: m.icon })),
    admin_p3m: LIB_MENUS.admin_p3m.map((m) => ({ label: m.label, href: m.page, icon: m.icon })),
    customer: LIB_MENUS.customer.map((m) => ({ label: m.label, href: m.page, icon: m.icon })),
};
export const menuForRole = (role) => libMenuForRole(role).map((m) => ({ label: m.label, href: m.page, icon: m.icon }));

/* ---------- Status badges (small rounded rectangles, never pills) ---------- */
const BADGE_STYLES = {
    teal: { background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' },
    gold: { background: 'color-mix(in srgb, var(--color-gold) 24%, white)', color: 'var(--color-gold-deep)' },
    danger: { background: 'var(--color-danger-tint)', color: 'var(--color-danger)' },
    neutral: { background: 'var(--color-surface)', color: 'var(--color-muted)' },
};

// Canonical status -> tone mapping (delegates to lib/statuses.js, plus
// legacy backend keys still used by older kept pages).
export function statusTone(status) {
    const s = String(status ?? '');
    if (['aktif', 'Aktif', 'approved', 'Approved', 'disetujui', 'Disetujui', 'selesai', 'Selesai', 'tersedia', 'Tersedia', 'verified', 'paid', 'lunas', 'Diverifikasi', 'Terverifikasi', 'Lunas'].includes(s)) return 'teal';
    if (['pending', 'Pending', 'menunggu', 'Menunggu', 'menunggu_pembayaran', 'menunggu_verifikasi', 'diproses', 'Diproses', 'diproses_admin', 'unggulan', 'draft_pengajuan', 'Diajukan', 'Menunggu Pembayaran', 'Menunggu Verifikasi Pembayaran'].includes(s)) return 'gold';
    if (['ditolak', 'Ditolak', 'rejected', 'dibatalkan', 'Dibatalkan', 'cancelled', 'nonaktif', 'Nonaktif', 'gagal'].includes(s)) return 'danger';
    return 'neutral';
}

export function StatusBadge({ status, label, tone }) {
    const t = tone ?? statusTone(status);
    return (
        <span
            className="inline-block rounded-md px-2 py-1 text-[11px] font-semibold"
            style={BADGE_STYLES[t]}
        >
            {label ?? status}
        </span>
    );
}

export function RoleBadge({ role }) {
    const n = normalizeRole(role);
    return <StatusBadge label={roleLabel(role)} tone={n === 'admin_rtpu' || n === 'super_admin' ? 'teal' : n === 'customer' ? 'neutral' : 'gold'} />;
}

/* ---------- Buttons ---------- */
export function PrimaryButton({ children, className = '', arrow = false, as: _as, ...props }) {
    const Tag = props.href ? Link : 'button';
    return (
        <Tag
            {...props}
            className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
            style={{ background: 'var(--color-accent)', color: 'var(--color-bg)' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-accent-hover)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-accent)'; }}
        >
            {children}
            {arrow && <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />}
        </Tag>
    );
}

export function SecondaryButton({ children, className = '', as: _as, ...props }) {
    const Tag = props.href ? Link : 'button';
    return (
        <Tag
            {...props}
            className={`inline-flex items-center justify-center gap-2 rounded-full border bg-white px-6 py-2.5 text-sm font-semibold transition hover:-translate-y-px active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', background: 'var(--color-bg)' }}
        >
            {children}
        </Tag>
    );
}

export function DangerButton({ children, className = '', ...props }) {
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
            style={{ background: 'var(--color-danger)' }}
        >
            {children}
        </button>
    );
}

/* ---------- Cards & layout ---------- */
export function Card({ children, className = '', style = {} }) {
    return (
        <div
            className={`rounded-[22px] border bg-white ${className}`}
            style={{ borderColor: 'var(--color-border)', ...style }}
        >
            {children}
        </div>
    );
}

export function PageHeader({ eyebrow, title, desc, actions }) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
                {eyebrow && (
                    <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                        {eyebrow}
                    </p>
                )}
                <h1 className="font-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-ink)' }}>
                    {title}
                </h1>
                {desc && (
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                        {desc}
                    </p>
                )}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
    );
}

export function StatCard({ label, value, suffix = '', icon: Icon, tone = 'teal', index = 0 }) {
    const reduce = useReducedMotion();
    const ref = useRef(null);
    const [n, setN] = useState(0);
    const started = useRef(false);
    useEffect(() => {
        if (reduce) { setN(value); return; }
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !started.current) {
                    started.current = true;
                    const t0 = performance.now();
                    const tick = (t) => {
                        const p = Math.min((t - t0) / 1400, 1);
                        setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
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
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: reduce ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.4, delay: reduce ? 0 : index * 0.06, ease: EASE }}
        >
            <Card className="flex items-center gap-4 p-5">
                {Icon && (
                    <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                        style={
                            tone === 'gold'
                                ? { background: 'color-mix(in srgb, var(--color-gold) 22%, white)', color: 'var(--color-gold-deep)' }
                                : tone === 'danger'
                                  ? { background: 'var(--color-danger-tint)', color: 'var(--color-danger)' }
                                  : { background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }
                        }
                    >
                        <Icon className="h-5 w-5" />
                    </span>
                )}
                <span>
                    <span className="block font-display text-2xl font-bold" style={{ color: 'var(--color-ink)' }}>
                        {n}{suffix}
                    </span>
                    <span className="block text-[13px]" style={{ color: 'var(--color-muted)' }}>{label}</span>
                </span>
            </Card>
        </motion.div>
    );
}

/* ---------- Table ---------- */
export function Table({ columns, children }) {
    return (
        <Card className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
                <thead style={{ background: 'var(--color-surface)' }}>
                    <tr>
                        {columns.map((c) => (
                            <th
                                key={c}
                                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                                style={{ color: 'var(--color-muted)' }}
                            >
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>{children}</tbody>
            </table>
        </Card>
    );
}

export function Td({ children, className = '', strong = false }) {
    return (
        <td
            className={`border-t px-6 py-4 ${className}`}
            style={{
                borderColor: 'var(--color-border)',
                color: strong ? 'var(--color-ink)' : undefined,
                fontWeight: strong ? 600 : undefined,
            }}
        >
            {children}
        </td>
    );
}

/* ---------- Forms ---------- */
export function Field({ label, error, children, htmlFor }) {
    return (
        <div>
            {label && (
                <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--color-ink)' }}>
                    {label}
                </label>
            )}
            {children}
            {error && <p className="mt-1.5 text-[13px]" style={{ color: 'var(--color-danger)' }}>{error}</p>}
        </div>
    );
}

export const inputClass =
    'block w-full rounded-xl border bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-sm';

export function inputStyleProps() {
    return {
        style: { borderColor: 'var(--color-border)', color: 'var(--color-ink)', background: 'var(--color-bg)' },
        onFocus: (e) => {
            e.currentTarget.style.borderColor = 'var(--color-accent)';
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-tint)';
        },
        onBlur: (e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.boxShadow = 'none';
        },
    };
}

/* ---------- Empty state ---------- */
export function EmptyState({ icon: Icon, title, desc, action }) {
    return (
        <Card className="p-12 text-center">
            {Icon && (
                <span
                    className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}
                >
                    <Icon className="h-7 w-7" />
                </span>
            )}
            <p className="font-display text-lg font-semibold" style={{ color: 'var(--color-ink)' }}>{title}</p>
            {desc && <p className="mx-auto mt-1 max-w-sm text-sm" style={{ color: 'var(--color-muted)' }}>{desc}</p>}
            {action && <div className="mt-5">{action}</div>}
        </Card>
    );
}

/* ---------- Filter tabs ---------- */
export function FilterTabs({ tabs, active, onChange }) {
    return (
        <div className="flex flex-wrap gap-2">
            {tabs.map((t) => {
                const on = active === t.value;
                return (
                    <button
                        key={t.value}
                        type="button"
                        onClick={() => onChange(t.value)}
                        className="rounded-full border px-4 py-1.5 text-[13px] font-medium transition"
                        style={
                            on
                                ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: 'var(--color-bg)' }
                                : { background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-muted)' }
                        }
                    >
                        {t.label}
                    </button>
                );
            })}
        </div>
    );
}

/* ---------- Pagination (works with Laravel paginator links or meta) ---------- */
export function Pagination({ links = [], meta }) {
    if (meta && (!meta.last_page || meta.last_page <= 1)) return null;
    if (!meta && links.length === 0) return null;
    const items = links.length > 0 ? links : [];
    if (items.length === 0) return null;
    return (
        <nav className="mt-6 flex items-center justify-center gap-1.5" aria-label="Navigasi halaman">
            {items.map((l, i) => {
                const label = String(l.label).replace('&laquo;', '‹').replace('&raquo;', '›').replace('Previous', '‹').replace('Next', '›');
                const isNav = label === '‹' || label === '›';
                const active = Boolean(l.active);
                const disabled = !l.url;
                if (disabled && !isNav) return null;
                return l.url ? (
                    <Link
                        key={i}
                        href={l.url}
                        preserveScroll
                        className="flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-sm font-medium transition"
                        style={
                            active
                                ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: 'var(--color-bg)' }
                                : { background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-ink)' }
                        }
                    >
                        {isNav ? (label === '‹' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : label}
                    </Link>
                ) : (
                    <span
                        key={i}
                        className="flex h-9 min-w-9 items-center justify-center rounded-full border px-2 text-sm opacity-30"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}
                    >
                        {isNav ? (label === '‹' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : label}
                    </span>
                );
            })}
        </nav>
    );
}

/* ---------- Confirm modal (framer-motion fade+scale; calm, dashboard-safe) ---------- */
export function ConfirmModal({ open, title, desc, confirmLabel = 'Ya, lanjutkan', danger = false, processing = false, onConfirm, onClose, children }) {
    const reduce = useReducedMotion();
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <motion.div
                className="absolute inset-0"
                style={{ background: 'rgba(26,29,28,0.5)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.2 }}
                onClick={onClose}
            />
            <motion.div
                className="relative w-full max-w-md rounded-[22px] border bg-white p-6"
                style={{ borderColor: 'var(--color-border)' }}
                initial={{ opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
            >
                <button type="button" onClick={onClose} aria-label="Tutup" className="absolute right-4 top-4 rounded-lg p-1" style={{ color: 'var(--color-muted)' }}>
                    <X className="h-4 w-4" />
                </button>
                <h3 className="font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>{title}</h3>
                {desc && <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>{desc}</p>}
                {children && <div className="mt-4">{children}</div>}
                <div className="mt-6 flex justify-end gap-2">
                    <SecondaryButton onClick={onClose}>Batal</SecondaryButton>
                    {danger ? (
                        <DangerButton onClick={onConfirm} disabled={processing}>
                            {processing ? 'Memproses…' : confirmLabel}
                        </DangerButton>
                    ) : (
                        <PrimaryButton onClick={onConfirm} disabled={processing}>
                            {processing ? 'Memproses…' : confirmLabel}
                        </PrimaryButton>
                    )}
                </div>
            </motion.div>
        </div>
    );
}

/* ---------- Status stepper (transactions) ---------- */
export function Stepper({ steps, current }) {
    return (
        <ol className="flex items-center">
            {steps.map((s, i) => {
                const done = i < current;
                const now = i === current;
                return (
                    <li key={s} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
                        <span className="flex items-center gap-2">
                            <span
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold"
                                style={
                                    done
                                        ? { background: 'var(--color-accent)', borderColor: 'var(--color-accent)', color: 'var(--color-bg)' }
                                        : now
                                          ? { borderColor: 'var(--color-accent)', color: 'var(--color-accent-hover)', background: 'var(--color-accent-tint)' }
                                          : { borderColor: 'var(--color-border)', color: 'var(--color-muted)', background: 'var(--color-bg)' }
                                }
                            >
                                {i + 1}
                            </span>
                            <span className="hidden text-[13px] font-medium sm:block" style={{ color: done || now ? 'var(--color-ink)' : 'var(--color-muted)' }}>
                                {s}
                            </span>
                        </span>
                        {i < steps.length - 1 && (
                            <span className="mx-2 h-px flex-1" style={{ background: done ? 'var(--color-accent)' : 'var(--color-border)' }} />
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

/* ---------- Dashboard content fade-in (calm 200ms, transform+opacity only) ---------- */
export function FadeIn({ children, className = '' }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
        >
            {children}
        </motion.div>
    );
}

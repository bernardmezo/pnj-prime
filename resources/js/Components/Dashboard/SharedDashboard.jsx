import React from 'react';
import { Link } from '@inertiajs/react';
import { Search } from 'lucide-react';

/**
 * Shared Design System Tokens
 */
export const TOKENS = {
    colors: {
        bg: 'var(--color-bg)',
        panelBg: '#FFFFFF',
        border: 'var(--color-border)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        subtle: 'var(--color-muted)',
        strip: 'var(--color-surface)',
        accent: 'var(--color-accent, var(--color-accent))',
        accentHover: 'var(--color-accent-hover, var(--color-deep))',
        accentTint: 'var(--color-accent-tint, var(--color-accent-tint))',
        amber: 'var(--color-gold, var(--color-gold))',
        amberText: 'var(--color-gold-deep, var(--color-gold-deep))',
        green: '#059669',
        red: '#EF4444',
        gray: 'var(--color-muted)',
    },
    radii: {
        sm: '6px',
        panel: '12px',
        full: '9999px',
    },
    spacing: {
        gap: '24px',
        padding: '32px',
        sidebarItemH: '40px',
        rowH: '72px',
    },
};

/**
 * Shared PageHeader:
 * 24px semibold title and one muted line (today's date in Indonesian).
 * NO role names or role labels.
 */
export function PageHeader({ title = 'Dashboard', subtitle }) {
    const today = (() => {
        try {
            return new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return 'Kamis, 29 Oktober 2026';
        }
    })();

    return (
        <div className="mb-7">
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest" style={{ borderColor: 'color-mix(in srgb, var(--color-accent) 22%, transparent)', color: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent-tint) 50%, transparent)' }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-gold)' }} />
                Dashboard
            </p>
            <h1 className="font-display text-[28px] font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                {title}
            </h1>
            <p className="mt-1.5 text-sm text-[var(--color-muted)]">
                {subtitle ?? today}
            </p>
        </div>
    );
}

/**
 * Shared Panel:
 * White, 1px border (var(--color-border)), 14px radius, subtle clean shadow, no nesting.
 */
export function Panel({ children, className = '', noPadding = false }) {
    return (
        <div
            className={`rounded-2xl border border-[var(--color-border)] bg-white shadow-card ${
                noPadding ? '' : 'p-6 sm:p-8'
            } ${className}`}
        >
            {children}
        </div>
    );
}

/**
 * Shared StatRow:
 * 3 to 4 numbers per panel with 1px vertical dividers.
 * 32px semibold number and 13px muted label.
 * Numbers needing action get amber dot and amber-700 text; zeros are gray.
 */
export function StatRow({ stats = [] }) {
    return (
        <div className={`grid grid-cols-2 lg:grid-cols-${stats.length} divide-y lg:divide-y-0 lg:divide-x divide-[var(--color-border)]`}>
            {stats.map((item) => {
                const needsAction = Boolean(item.needsAction && item.value > 0);
                const isZero = item.value === 0;

                return (
                    <div
                        key={item.label}
                        className="relative py-3 lg:py-0 lg:px-6 first:pl-0 last:pr-0"
                    >
                        {needsAction && item.highlightBar && (
                            <span
                                className="absolute -top-6 lg:-top-8 left-0 right-0 h-[2.5px] bg-[var(--color-gold)] rounded-full"
                                aria-hidden
                            />
                        )}
                        <div
                            className={`leading-tight tabular-nums ${
                                needsAction
                                    ? 'text-[32px] sm:text-[36px] font-semibold text-[var(--color-gold-deep)]'
                                    : isZero
                                      ? 'text-[32px] font-semibold text-[var(--color-muted)]'
                                      : 'text-[32px] font-semibold text-[var(--color-ink)]'
                            }`}
                        >
                            {item.formattedValue ?? item.value}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[var(--color-muted)] font-normal">
                            {needsAction && (
                                <span className="inline-block h-2 w-2 rounded-full bg-[var(--color-gold)] shrink-0" aria-hidden />
                            )}
                            <span>{item.label}</span>
                        </div>
                        {item.helper && (
                            <p className="mt-0.5 text-[11px] text-[var(--color-muted)]">{item.helper}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/**
 * Shared StatusDot:
 * Status as an 8px dot + plain text. Zero pills/badges.
 * amber = needs action, teal = in progress, green = done, red = rejected/cancelled, gray = other
 */
export function StatusDot({ status }) {
    const s = String(status || '').toLowerCase();
    let bg = 'var(--color-muted)'; // gray

    if (
        s.includes('diajukan') ||
        s.includes('menunggu verifikasi') ||
        s.includes('perlu tindakan') ||
        s.includes('menunggu keputusan') ||
        s.includes('revisi')
    ) {
        bg = 'var(--color-gold, var(--color-gold))'; // amber
    } else if (
        s.includes('proses') ||
        s.includes('menunggu pembayaran') ||
        s.includes('aktif') ||
        s.includes('dikerjakan')
    ) {
        bg = 'var(--color-accent, var(--color-accent))'; // teal
    } else if (
        s.includes('selesai') ||
        s.includes('disetujui') ||
        s.includes('lunas')
    ) {
        bg = '#059669'; // green
    } else if (
        s.includes('tolak') ||
        s.includes('batal') ||
        s.includes('nonaktif')
    ) {
        bg = 'var(--color-danger, #d64545)'; // red
    }

    return (
        <div className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-[var(--color-ink)] font-normal">
            <span
                className="inline-block h-2 w-2 rounded-full shrink-0"
                style={{ background: bg }}
                aria-hidden
            />
            <span>{status}</span>
        </div>
    );
}

/**
 * Shared Rectangular Button (6px radius, teal focus ring, no pills)
 */
export function Button({
    children,
    onClick,
    type = 'button',
    variant = 'primary', // 'primary' | 'outline' | 'secondary'
    className = '',
    href,
    ...props
}) {
    const baseStyle =
        'inline-flex items-center justify-center text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1';

    let variantStyle = '';
    if (variant === 'primary') {
        variantStyle = 'rounded-full bg-[var(--color-accent)] px-4 py-2 text-[var(--color-bg)] shadow-sm hover:bg-[var(--color-accent-hover)]';
    } else if (variant === 'outline') {
        variantStyle =
            'rounded-xl border border-[var(--color-border)] bg-white px-3 py-1.5 text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-tint)] hover:text-[var(--color-accent)]';
    } else if (variant === 'secondary') {
        variantStyle = 'rounded-xl bg-[var(--color-surface)] px-3 py-1.5 text-[var(--color-ink)] hover:bg-[var(--color-border)]';
    }

    if (href) {
        return (
            <Link href={href} className={`${baseStyle} ${variantStyle} ${className}`} {...props}>
                {children}
            </Link>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            className={`${baseStyle} ${variantStyle} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}

/**
 * Shared SearchInput (6px radius, neutral border, teal focus ring)
 */
export function SearchInput({ value, onChange, placeholder = 'Cari...', className = '' }) {
    return (
        <div className={`relative w-full sm:w-64 ${className}`}>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-xl border border-[var(--color-border)] bg-white py-2 pl-9 pr-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-muted)] outline-none transition duration-150 focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-tint)]"
            />
        </div>
    );
}

/**
 * Shared Tabs (Underlined text, no pills, no background highlights)
 */
export function Tabs({ tabs = [], activeTab, onChange }) {
    return (
        <div className="flex items-center gap-6 border-b border-[var(--color-border)] pb-2 text-xs">
            {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={`relative pb-1 transition-colors ${
                            isActive
                                ? 'font-semibold text-[var(--color-accent)]'
                                : 'text-[var(--color-muted)] hover:text-[var(--color-ink)] font-normal'
                        }`}
                    >
                        <span>{tab.label}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="ml-1.5 tabular-nums text-[11px] text-[var(--color-muted)]">
                                ({tab.count})
                            </span>
                        )}
                        {isActive && (
                            <span className="absolute inset-x-0 -bottom-2 h-[2px] rounded-full bg-gradient-to-r from-[var(--color-gold)] to-[var(--color-accent)]" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}

/**
 * Shared DataTable Container & Row specs:
 * 72px rows, 14px main text with 12px muted second line,
 * 1px dividers, header on var(--color-surface) strip, numbers right-aligned with tabular-nums,
 * 3px amber left edge on rows needing action.
 */
export function DataTable({ headers = [], children, emptyMessage = 'Tidak ada data ditemukan.' }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                        {headers.map((h, i) => (
                            <th
                                key={i}
                                className={`py-3 px-6 ${h.align === 'right' ? 'text-right' : ''} ${h.className || ''}`}
                            >
                                {h.label}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                    {children}
                </tbody>
            </table>
        </div>
    );
}

/**
 * Shared Loading Skeleton
 */
export function Skeleton({ className = 'h-6 w-full' }) {
    return (
        <div className={`animate-pulse rounded-md bg-[var(--color-border)]/70 ${className}`} />
    );
}

/**
 * Shared EmptyState:
 * Neutral one-sentence muted text with no illustration.
 */
export function EmptyState({ message = 'Tidak ada data ditemukan.' }) {
    return (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center text-sm text-[var(--color-muted)]">
            {message}
        </div>
    );
}

/**
 * Shared ActivityList:
 * Quiet list of recent events on single lines with muted right-aligned timestamps.
 */
export function ActivityList({ title = 'Aktivitas terbaru', items = [] }) {
    if (!items || items.length === 0) return null;

    return (
        <Panel className="space-y-4">
            <h3 className="text-sm font-semibold text-[var(--color-ink)]">
                {title}
            </h3>
            <div className="divide-y divide-[var(--color-border)]">
                {items.map((it, idx) => (
                    <div
                        key={it.id ?? idx}
                        className="py-3 flex items-center justify-between gap-4 text-xs first:pt-0 last:pb-0"
                    >
                        <span className="text-[var(--color-ink)] truncate">{it.text}</span>
                        <span className="text-[var(--color-muted)] shrink-0 tabular-nums">{it.timestamp}</span>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

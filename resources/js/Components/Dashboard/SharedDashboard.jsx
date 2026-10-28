import React from 'react';
import { Link } from '@inertiajs/react';
import { Search } from 'lucide-react';

/**
 * Shared Design System Tokens
 */
export const TOKENS = {
    colors: {
        bg: '#F7F8FA',
        panelBg: '#FFFFFF',
        border: '#E5E7EB',
        ink: '#111827',
        muted: '#6B7280',
        subtle: '#9CA3AF',
        strip: '#F9FAFB',
        accent: 'var(--color-accent, #00998a)',
        accentHover: 'var(--color-accent-hover, #007468)',
        accentTint: 'rgba(0, 153, 138, 0.08)',
        amber: '#F59E0B',
        amberText: '#B45309',
        green: '#10B981',
        red: '#EF4444',
        gray: '#9CA3AF',
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
        <div className="mb-6">
            <h1 className="text-2xl font-semibold text-[#111827]">
                {title}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
                {subtitle ?? today}
            </p>
        </div>
    );
}

/**
 * Shared Panel:
 * White, 1px border (#E5E7EB), 12px radius, no shadows, no nesting.
 */
export function Panel({ children, className = '', noPadding = false }) {
    return (
        <div
            className={`rounded-[12px] border border-[#E5E7EB] bg-white ${
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
        <div className={`grid grid-cols-2 lg:grid-cols-${stats.length} divide-y lg:divide-y-0 lg:divide-x divide-[#E5E7EB]`}>
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
                                className="absolute -top-6 lg:-top-8 left-0 right-0 h-[2px] bg-amber-500 rounded-full"
                                aria-hidden
                            />
                        )}
                        <div
                            className={`leading-tight tabular-nums ${
                                needsAction
                                    ? 'text-[32px] sm:text-[36px] font-semibold text-amber-700'
                                    : isZero
                                      ? 'text-[32px] font-semibold text-slate-400'
                                      : 'text-[32px] font-semibold text-[#111827]'
                            }`}
                        >
                            {item.formattedValue ?? item.value}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-slate-600 font-normal">
                            {needsAction && (
                                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 shrink-0" aria-hidden />
                            )}
                            <span>{item.label}</span>
                        </div>
                        {item.helper && (
                            <p className="mt-0.5 text-[11px] text-slate-400">{item.helper}</p>
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
    let bg = '#9CA3AF'; // gray

    if (
        s.includes('diajukan') ||
        s.includes('menunggu verifikasi') ||
        s.includes('perlu tindakan') ||
        s.includes('menunggu keputusan') ||
        s.includes('revisi')
    ) {
        bg = '#F59E0B'; // amber
    } else if (
        s.includes('proses') ||
        s.includes('menunggu pembayaran') ||
        s.includes('aktif') ||
        s.includes('dikerjakan')
    ) {
        bg = 'var(--color-accent, #00998a)'; // teal
    } else if (
        s.includes('selesai') ||
        s.includes('disetujui') ||
        s.includes('lunas')
    ) {
        bg = '#10B981'; // green
    } else if (
        s.includes('tolak') ||
        s.includes('batal') ||
        s.includes('nonaktif')
    ) {
        bg = '#EF4444'; // red
    }

    return (
        <div className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-slate-700 font-normal">
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
        'inline-flex items-center justify-center rounded-[6px] text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-1';

    let variantStyle = '';
    if (variant === 'primary') {
        variantStyle = 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] px-4 py-2';
    } else if (variant === 'outline') {
        variantStyle =
            'border border-[#E5E7EB] bg-white text-slate-700 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] px-3 py-1.5';
    } else if (variant === 'secondary') {
        variantStyle = 'bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5';
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
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-[6px] border border-[#E5E7EB] bg-white py-1.5 pl-8 pr-3 text-xs placeholder:text-slate-400 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
        </div>
    );
}

/**
 * Shared Tabs (Underlined text, no pills, no background highlights)
 */
export function Tabs({ tabs = [], activeTab, onChange }) {
    return (
        <div className="flex items-center gap-6 border-b border-[#E5E7EB] pb-2 text-xs">
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
                                : 'text-slate-500 hover:text-slate-900 font-normal'
                        }`}
                    >
                        <span>{tab.label}</span>
                        {tab.count !== undefined && tab.count > 0 && (
                            <span className="ml-1.5 tabular-nums text-[11px] text-slate-400">
                                ({tab.count})
                            </span>
                        )}
                        {isActive && (
                            <span className="absolute inset-x-0 -bottom-2 h-[2px] bg-[var(--color-accent)]" />
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
 * 1px dividers, header on #F9FAFB strip, numbers right-aligned with tabular-nums,
 * 3px amber left edge on rows needing action.
 */
export function DataTable({ headers = [], children, emptyMessage = 'Tidak ada data ditemukan.' }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
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
                <tbody className="divide-y divide-[#E5E7EB]">
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
        <div className={`animate-pulse rounded-[4px] bg-slate-200/70 ${className}`} />
    );
}

/**
 * Shared EmptyState:
 * Neutral one-sentence muted text with no illustration.
 */
export function EmptyState({ message = 'Tidak ada data ditemukan.' }) {
    return (
        <div className="py-16 text-center text-sm text-slate-500">
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
            <h3 className="text-sm font-semibold text-[#111827]">
                {title}
            </h3>
            <div className="divide-y divide-[#E5E7EB]">
                {items.map((it, idx) => (
                    <div
                        key={it.id ?? idx}
                        className="py-3 flex items-center justify-between gap-4 text-xs first:pt-0 last:pb-0"
                    >
                        <span className="text-slate-700 truncate">{it.text}</span>
                        <span className="text-slate-400 shrink-0 tabular-nums">{it.timestamp}</span>
                    </div>
                ))}
            </div>
        </Panel>
    );
}

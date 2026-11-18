import { useId } from 'react';

/**
 * Grafik ringan berbasis SVG + Tailwind, tanpa library. Semua grafik punya
 * ringkasan teks (role="img" + aria-label) dan tabel/daftar di sampingnya agar
 * dapat dibaca pembaca layar. Warna memakai token desain PRIME.
 */

export const formatRupiah = (n) => 'Rp ' + Number(n || 0).toLocaleString('id-ID');

export const formatRupiahSingkat = (n) => {
    const v = Number(n || 0);
    if (v >= 1_000_000_000) return `Rp ${(v / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
    if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1).replace('.', ',')} jt`;
    if (v >= 1_000) return `Rp ${Math.round(v / 1_000)} rb`;
    return `Rp ${v}`;
};

const PALETTE = [
    'var(--color-accent)',
    'var(--color-gold)',
    'var(--color-accent-hover)',
    'var(--color-gold-deep)',
    'var(--color-muted)',
    'var(--color-ink)',
];

/** Bar horizontal: daftar label + nilai + batang. */
export function HorizontalBars({ items = [], valueFormat = (v) => v, color = 'var(--color-accent)', ariaLabel }) {
    const max = Math.max(...items.map((i) => i.value), 1);
    return (
        <ul className="space-y-3" aria-label={ariaLabel}>
            {items.map((item, idx) => (
                <li key={item.key ?? item.label ?? idx}>
                    <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <span className="min-w-0 truncate text-[var(--color-ink)]" title={item.label}>{item.label}</span>
                        <span className="shrink-0 font-semibold tabular-nums text-[var(--color-ink)]">{valueFormat(item.value)}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface)]" aria-hidden>
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.max(item.value > 0 ? 2 : 0, (item.value / max) * 100)}%`, background: item.color ?? color }}
                        />
                    </div>
                </li>
            ))}
        </ul>
    );
}

/** Area/garis untuk tren. points: [{label, value}] */
export function AreaChart({ points = [], valueFormat = formatRupiahSingkat, height = 220, ariaLabel }) {
    const gid = useId().replace(/:/g, '');
    const W = 600;
    const H = height;
    const pad = { l: 8, r: 8, t: 16, b: 28 };
    const max = Math.max(...points.map((p) => p.value), 1);
    const innerW = W - pad.l - pad.r;
    const innerH = H - pad.t - pad.b;
    const x = (i) => pad.l + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
    const y = (v) => pad.t + innerH - (v / max) * innerH;

    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
    const area = points.length
        ? `${line} L${x(points.length - 1).toFixed(1)},${pad.t + innerH} L${x(0).toFixed(1)},${pad.t + innerH} Z`
        : '';

    // Label sumbu-x: maksimal ±6 supaya tidak bertumpuk.
    const step = Math.max(1, Math.ceil(points.length / 6));
    const total = points.reduce((a, p) => a + p.value, 0);
    const summary = ariaLabel ?? `Grafik tren, total ${valueFormat(total)}, puncak ${valueFormat(max)}.`;

    return (
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={summary}>
            <defs>
                <linearGradient id={`g-${gid}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.02" />
                </linearGradient>
            </defs>
            {[0, 0.5, 1].map((t) => (
                <line key={t} x1={pad.l} x2={W - pad.r} y1={pad.t + innerH * (1 - t)} y2={pad.t + innerH * (1 - t)} stroke="var(--color-border)" strokeDasharray={t === 0 ? undefined : '3 4'} />
            ))}
            {area && <path d={area} fill={`url(#g-${gid})`} />}
            {line && <path d={line} fill="none" stroke="var(--color-accent)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />}
            {points.map((p, i) => (
                <g key={p.key ?? p.label ?? i}>
                    <circle cx={x(i)} cy={y(p.value)} r={p.value > 0 ? 3.5 : 2} fill={p.value > 0 ? 'var(--color-gold)' : 'var(--color-border)'} stroke="white" strokeWidth="1.5">
                        <title>{`${p.label}: ${valueFormat(p.value)}`}</title>
                    </circle>
                    {i % step === 0 && (
                        <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--color-muted)">{p.label}</text>
                    )}
                </g>
            ))}
        </svg>
    );
}

/** Donut dengan legenda. slices: [{label, value}] */
export function DonutChart({ slices = [], valueFormat = (v) => v, centerLabel, ariaLabel }) {
    const total = slices.reduce((a, s) => a + s.value, 0);
    const R = 52;
    const C = 2 * Math.PI * R;
    let offset = 0;

    return (
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
            <svg viewBox="0 0 140 140" className="h-40 w-40 shrink-0" role="img" aria-label={ariaLabel ?? `Diagram donat, total ${valueFormat(total)}`}>
                <circle cx="70" cy="70" r={R} fill="none" stroke="var(--color-surface)" strokeWidth="18" />
                {total > 0 && slices.map((s, i) => {
                    const len = (s.value / total) * C;
                    const el = (
                        <circle
                            key={s.label}
                            cx="70" cy="70" r={R} fill="none"
                            stroke={PALETTE[i % PALETTE.length]} strokeWidth="18"
                            strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset}
                            transform="rotate(-90 70 70)"
                        >
                            <title>{`${s.label}: ${valueFormat(s.value)}`}</title>
                        </circle>
                    );
                    offset += len;
                    return el;
                })}
                {centerLabel && (
                    <text x="70" y="74" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--color-ink)">{centerLabel}</text>
                )}
            </svg>
            <ul className="w-full min-w-0 flex-1 space-y-2 text-sm">
                {slices.map((s, i) => (
                    <li key={s.label} className="flex items-center justify-between gap-3">
                        <span className="flex min-w-0 items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} aria-hidden />
                            <span className="truncate text-[var(--color-ink)]" title={s.label}>{s.label}</span>
                        </span>
                        <span className="shrink-0 tabular-nums font-semibold text-[var(--color-ink)]">
                            {valueFormat(s.value)}
                            {total > 0 && <span className="ml-1.5 font-normal text-[var(--color-muted)]">{Math.round((s.value / total) * 100)}%</span>}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

/** Bar vertikal sederhana untuk deret waktu pendek (mis. pendaftaran per bulan). */
export function ColumnChart({ points = [], valueFormat = (v) => v, ariaLabel }) {
    const max = Math.max(...points.map((p) => p.value), 1);
    return (
        <div role="img" aria-label={ariaLabel ?? 'Diagram batang'}>
            <div className="flex h-44 items-end justify-between gap-2 border-b border-[var(--color-border)] px-1">
                {points.map((p, i) => (
                    <div key={p.key ?? p.label ?? i} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                        <span className="text-[11px] tabular-nums text-[var(--color-muted)]">{valueFormat(p.value)}</span>
                        <div
                            className="relative w-full max-w-[40px] rounded-t-[3px] bg-[var(--color-accent)] after:absolute after:inset-x-0 after:top-0 after:h-[3px] after:bg-[var(--color-gold)] transition-all duration-500"
                            style={{ height: `${p.value > 0 ? Math.max(6, (p.value / max) * 100) : 0}%` }}
                            title={`${p.label}: ${valueFormat(p.value)}`}
                        />
                    </div>
                ))}
            </div>
            <div className="mt-1.5 flex justify-between gap-2 px-1">
                {points.map((p, i) => (
                    <span key={p.key ?? p.label ?? i} className="flex-1 text-center text-[11px] text-[var(--color-muted)]">{p.label}</span>
                ))}
            </div>
        </div>
    );
}

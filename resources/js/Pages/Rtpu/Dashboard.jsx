import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    Calendar,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    CreditCard,
    History,
    Layers,
    Package,
    Search,
    Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EASE, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

/* ───── Animated Counter ───── */
function AnimatedNumber({ value = 0, duration = 1200 }) {
    const reduce = useReducedMotion();
    const [n, setN] = useState(0);
    const started = useRef(false);
    const ref = useRef(null);

    useEffect(() => {
        if (reduce) {
            setN(value);
            return;
        }
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started.current) {
                    started.current = true;
                    const t0 = performance.now();
                    const tick = (t) => {
                        const p = Math.min((t - t0) / duration, 1);
                        setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
                        if (p < 1) requestAnimationFrame(tick);
                    };
                    requestAnimationFrame(tick);
                }
            },
            { threshold: 0.2 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, [value, duration, reduce]);

    return <span ref={ref}>{n}</span>;
}

/* ───── Interactive Donut Chart ───── */
const CHART_COLORS = {
    gold: { stroke: '#f2b134', bg: 'rgba(242, 177, 52, 0.15)', text: '#c8860f' },
    teal: { stroke: '#00998a', bg: 'rgba(0, 153, 138, 0.15)', text: '#007468' },
    danger: { stroke: '#d64545', bg: 'rgba(214, 69, 69, 0.15)', text: '#d64545' },
    muted: { stroke: '#cbd5e1', bg: 'rgba(203, 213, 225, 0.2)', text: '#64748b' },
};

function InteractiveDonutChart({ data = [], size = 190 }) {
    const reduce = useReducedMotion();
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const total = data.reduce((s, d) => s + (d.value ?? 0), 0);

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-6 text-center">
                <svg viewBox="0 0 100 100" width={size} height={size}>
                    <circle cx="50" cy="50" r="38" fill="none" stroke="var(--color-border)" strokeWidth="11" />
                    <text x="50" y="54" textAnchor="middle" fill="var(--color-muted)" fontSize="9" fontWeight="600">
                        Belum Ada Data
                    </text>
                </svg>
            </div>
        );
    }

    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    let cumulative = 0;

    const activeItem = hoveredIdx !== null ? data[hoveredIdx] : null;

    return (
        <div className="relative flex flex-col items-center">
            <div className="relative">
                <svg viewBox="0 0 100 100" width={size} height={size} className="overflow-visible">
                    {/* Background track circle */}
                    <circle cx="50" cy="50" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />

                    {data
                        .filter((d) => d.value > 0)
                        .map((d, i) => {
                            const pct = d.value / total;
                            const offset = circumference * (1 - pct);
                            const rotation = cumulative * 360 - 90;
                            cumulative += pct;
                            const isHovered = hoveredIdx === i;
                            const col = CHART_COLORS[d.tone] ?? CHART_COLORS.teal;

                            return (
                                <motion.circle
                                    key={d.label}
                                    cx="50"
                                    cy="50"
                                    r={radius}
                                    fill="none"
                                    stroke={col.stroke}
                                    strokeWidth={isHovered ? 13 : 10}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={offset}
                                    strokeLinecap="round"
                                    transform={`rotate(${rotation} 50 50)`}
                                    className="cursor-pointer transition-all duration-300"
                                    onMouseEnter={() => setHoveredIdx(i)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : i * 0.08 }}
                                />
                            );
                        })}

                    {/* Center stats display */}
                    <text
                        x="50"
                        y={activeItem ? 45 : 47}
                        textAnchor="middle"
                        fill="var(--color-ink)"
                        fontSize={activeItem ? '15' : '17'}
                        fontWeight="700"
                        fontFamily="Sora, sans-serif"
                    >
                        {activeItem ? activeItem.value : total}
                    </text>
                    <text
                        x="50"
                        y={activeItem ? 58 : 59}
                        textAnchor="middle"
                        fill="var(--color-muted)"
                        fontSize="6"
                        fontWeight="600"
                    >
                        {activeItem ? `${Math.round((activeItem.value / total) * 100)}% Pengajuan` : 'Total Pengajuan'}
                    </text>
                </svg>
            </div>

            {/* Quick breakdown bars */}
            <div className="mt-4 w-full space-y-2">
                {data.map((d, i) => {
                    if (d.value === 0) return null;
                    const pct = Math.round((d.value / total) * 100);
                    const col = CHART_COLORS[d.tone] ?? CHART_COLORS.teal;
                    const isHovered = hoveredIdx === i;

                    return (
                        <button
                            key={d.label}
                            type="button"
                            onClick={() => setHoveredIdx(hoveredIdx === i ? null : i)}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            className={`flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs transition-colors text-left ${
                                isHovered ? 'bg-slate-100/80 shadow-sm' : 'hover:bg-slate-50'
                            }`}
                        >
                            <span className="flex items-center gap-2 min-w-0">
                                <span
                                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                                    style={{ background: col.stroke }}
                                />
                                <span className="truncate font-medium" style={{ color: 'var(--color-ink)' }}>
                                    {d.label}
                                </span>
                            </span>
                            <span className="flex items-center gap-2 pl-2 shrink-0">
                                <span className="font-semibold text-slate-900">{d.value}</span>
                                <span className="text-[11px] text-slate-400">({pct}%)</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

/* ───── Metric KPI Card ───── */
function MetricKpiCard({
    title,
    value,
    desc,
    icon: Icon,
    badge,
    tone = 'teal',
    href,
    actionLabel = 'Buka Menu',
    index = 0,
}) {
    const reduce = useReducedMotion();

    const themes = {
        teal: {
            topBar: 'linear-gradient(90deg, #00998a, #00bfa5)',
            iconBg: 'rgba(0, 153, 138, 0.12)',
            iconColor: '#007468',
            hoverBorder: 'rgba(0, 153, 138, 0.35)',
            badgeBg: 'rgba(0, 153, 138, 0.1)',
            badgeColor: '#007468',
        },
        gold: {
            topBar: 'linear-gradient(90deg, #f2b134, #f59e0b)',
            iconBg: 'rgba(242, 177, 52, 0.18)',
            iconColor: '#c8860f',
            hoverBorder: 'rgba(242, 177, 52, 0.4)',
            badgeBg: 'rgba(242, 177, 52, 0.15)',
            badgeColor: '#c8860f',
        },
        emerald: {
            topBar: 'linear-gradient(90deg, #10b981, #059669)',
            iconBg: 'rgba(16, 185, 129, 0.12)',
            iconColor: '#059669',
            hoverBorder: 'rgba(16, 185, 129, 0.35)',
            badgeBg: 'rgba(16, 185, 129, 0.12)',
            badgeColor: '#059669',
        },
        danger: {
            topBar: 'linear-gradient(90deg, #ef4444, #dc2626)',
            iconBg: 'rgba(239, 68, 68, 0.12)',
            iconColor: '#dc2626',
            hoverBorder: 'rgba(239, 68, 68, 0.35)',
            badgeBg: 'rgba(239, 68, 68, 0.12)',
            badgeColor: '#dc2626',
        },
    };

    const t = themes[tone] ?? themes.teal;
    const Tag = href ? Link : 'div';

    return (
        <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : index * 0.08, ease: EASE }}
        >
            <Tag
                {...(href ? { href } : {})}
                className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[22px] border bg-white p-5 shadow-xs transition-all duration-300 ${
                    href ? 'hover:-translate-y-1 hover:shadow-lg' : ''
                }`}
                style={{ borderColor: 'var(--color-border)' }}
            >
                {/* Decorative top color bar */}
                <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: t.topBar }} />

                <div>
                    <div className="flex items-start justify-between gap-3">
                        <span
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-105"
                            style={{ background: t.iconBg, color: t.iconColor }}
                        >
                            <Icon className="h-5 w-5" />
                        </span>

                        {badge && (
                            <span
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                style={{ background: t.badgeBg, color: t.badgeColor }}
                            >
                                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: t.iconColor }} />
                                {badge}
                            </span>
                        )}
                    </div>

                    <div className="mt-4">
                        <div className="font-display text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-ink)' }}>
                            <AnimatedNumber value={value} />
                        </div>
                        <h3 className="mt-1 text-sm font-semibold text-slate-800">{title}</h3>
                        {desc && <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{desc}</p>}
                    </div>
                </div>

                {href && (
                    <div className="mt-4 flex items-center gap-1 pt-3 border-t border-slate-100 text-xs font-semibold" style={{ color: t.iconColor }}>
                        <span>{actionLabel}</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                )}
            </Tag>
        </motion.div>
    );
}

/* ───── Modern Executive Action Tile ───── */
function ActionTile({ label, meta, icon: Icon, href, badge, tone = 'teal', index = 0 }) {
    const reduce = useReducedMotion();

    return (
        <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : 0.15 + index * 0.04, ease: EASE }}
        >
            <Link
                href={href}
                className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:shadow-md"
            >
                <div className="flex items-center gap-3 min-w-0">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-colors duration-200 group-hover:bg-[var(--color-accent-tint)] group-hover:text-[var(--color-accent-hover)]">
                        <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                        <span className="block truncate text-sm font-bold text-slate-800 transition-colors duration-200 group-hover:text-[var(--color-accent)]">
                            {label}
                        </span>
                        {meta && (
                            <span className="block truncate text-xs text-slate-400 font-medium">
                                {meta}
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {badge > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-bold text-amber-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                            {badge}
                        </span>
                    )}
                    <ArrowUpRight className="h-4 w-4 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--color-accent)]" />
                </div>
            </Link>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════════════════════ */
/*  RTPU DASHBOARD PAGE                                              */
/* ═══════════════════════════════════════════════════════════════════ */
export default function RtpuDashboard({
    auth,
    stats = {},
    stages = [],
    statusDistribution = [],
    recentPengajuan = [],
}) {
    const role = auth?.user?.role;
    const reduce = useReducedMotion();

    // Search and status filter for recent table
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState('all');

    const pendingActionsTotal = stats.pending_actions ?? (stats.menunggu_verifikasi ?? 0) + (stats.verifikasi_bayar ?? 0);

    // Filtering recent pengajuan
    const filteredPengajuan = useMemo(() => {
        return (recentPengajuan ?? []).filter((p) => {
            const matchesQuery =
                !searchQuery ||
                p.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.layanan?.toLowerCase().includes(searchQuery.toLowerCase());

            if (!matchesQuery) return false;

            if (selectedTab === 'action_needed') {
                return ['Diajukan', 'Menunggu Verifikasi Pembayaran'].includes(p.status);
            }
            if (selectedTab === 'in_progress') {
                return ['Diproses', 'Menunggu Pembayaran'].includes(p.status);
            }
            if (selectedTab === 'completed') {
                return p.status === 'Selesai';
            }
            return true;
        });
    }, [recentPengajuan, searchQuery, selectedTab]);

    return (
        <DashboardLayout title="Dashboard" breadcrumb="Admin RTPU / Dashboard" activeKey="dashboard">
            <Head title="Pusat Kendali Admin RTPU · PNJ Prime" />
            <FadeIn>
                {/* ── Page Header ── */}
                <div className="mb-8">
                    <PageHeader
                        eyebrow="Admin RTPU"
                        title={`Selamat datang, ${auth?.user?.name ?? 'Admin'}!`}
                        desc="Kelola verifikasi, alur layanan, dan status pembayaran dari satu tempat."
                    />
                </div>

                {/* ══════════════════════════════════════════════════════ */}
                {/* 2. OPERATIONAL LIFECYCLE PIPELINE (FUNNEL)             */}
                {/* ══════════════════════════════════════════════════════ */}
                <div className="mb-8">
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-[var(--color-accent)]" />
                            <h2 className="font-display text-base font-bold text-slate-900">
                                Alur Siklus Layanan (Service Funnel)
                            </h2>
                        </div>
                        <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                            Klik tahapan untuk membuka modul kerja
                        </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                        {(stages ?? []).map((stage, idx) => {
                            const isPendingAttention = (stage.count ?? 0) > 0 && ['diajukan', 'verifikasi_bayar'].includes(stage.key);
                            const url = navHref(stage.routeKey, {}, role);

                            return (
                                <motion.div
                                    key={stage.key}
                                    initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: reduce ? 0 : 0.35, delay: reduce ? 0 : idx * 0.06, ease: EASE }}
                                >
                                    <Link
                                        href={url}
                                        className={`group relative flex h-full flex-col justify-between rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${
                                            isPendingAttention ? 'bg-amber-50/40 border-amber-200' : 'bg-white'
                                        }`}
                                        style={!isPendingAttention ? { borderColor: 'var(--color-border)' } : {}}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span
                                                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                        isPendingAttention
                                                            ? 'bg-amber-200 text-amber-900'
                                                            : 'bg-slate-100 text-slate-700'
                                                    }`}
                                                >
                                                    {stage.step}
                                                </span>

                                                <span
                                                    className={`font-display text-xl font-bold ${
                                                        isPendingAttention ? 'text-amber-800' : 'text-slate-900'
                                                    }`}
                                                >
                                                    <AnimatedNumber value={stage.count ?? 0} />
                                                </span>
                                            </div>

                                            <div className="mt-3">
                                                <div className="text-xs font-bold text-slate-800 group-hover:text-[var(--color-accent)] transition-colors">
                                                    {stage.shortName}
                                                </div>
                                                <p className="mt-0.5 text-[11px] text-slate-500 leading-tight">
                                                    {stage.desc}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-500 group-hover:text-[var(--color-accent)]">
                                            <span>Buka Alur</span>
                                            <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════ */}
                {/* 3. PRIMARY METRICS (4 KEY CARDS)                       */}
                {/* ══════════════════════════════════════════════════════ */}
                <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricKpiCard
                        title="Verifikasi Pengajuan"
                        value={stats.menunggu_verifikasi ?? 0}
                        desc="Pengajuan baru menunggu persetujuan berkas & persyaratan."
                        icon={ClipboardCheck}
                        tone="gold"
                        badge={(stats.menunggu_verifikasi ?? 0) > 0 ? 'Perlu Tindakan' : null}
                        href={navHref('rtpu.verify.layanan', {}, role)}
                        actionLabel="Verifikasi Sekarang"
                        index={0}
                    />

                    <MetricKpiCard
                        title="Verifikasi Pembayaran"
                        value={stats.verifikasi_bayar ?? 0}
                        desc="Bukti pembayaran dari customer siap dikonfirmasi."
                        icon={Wallet}
                        tone="gold"
                        badge={(stats.verifikasi_bayar ?? 0) > 0 ? 'Perlu Dikonfirmasi' : null}
                        href={navHref('rtpu.verify.bayar', {}, role)}
                        actionLabel="Periksa Bukti Transfer"
                        index={1}
                    />

                    <MetricKpiCard
                        title="Pengerjaan Aktif"
                        value={stats.diproses ?? 0}
                        desc="Layanan yang saat ini sedang dalam proses pelaksanaan."
                        icon={Activity}
                        tone="teal"
                        href={navHref('rtpu.status', {}, role)}
                        actionLabel="Kelola Status Pengerjaan"
                        index={2}
                    />

                    <MetricKpiCard
                        title="Layanan Selesai"
                        value={stats.selesai ?? 0}
                        desc={`Tingkat keberhasilan penyelesaian: ${stats.completion_rate ?? 0}%`}
                        icon={CheckCircle2}
                        tone="emerald"
                        badge={`${stats.completion_rate ?? 0}% Selesai`}
                        href={navHref('rtpu.riwayat', {}, role)}
                        actionLabel="Lihat Arsip Riwayat"
                        index={3}
                    />
                </div>

                {/* ══════════════════════════════════════════════════════ */}
                {/* 4. ANALYTICS & QUICK ACTION COMMAND CENTER             */}
                {/* ══════════════════════════════════════════════════════ */}
                <div className="mb-8 grid gap-6 lg:grid-cols-[360px_1fr]">
                    {/* Visual Donut Chart & Breakdown */}
                    <motion.div
                        initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: reduce ? 0 : 0.45, delay: 0.15, ease: EASE }}
                        className="flex flex-col"
                    >
                        <div className="mb-3">
                            <h2 className="font-display text-base font-bold text-slate-900">
                                Distribusi Status
                            </h2>
                            <p className="text-xs text-slate-500">Komposisi seluruh tiket layanan RTPU</p>
                        </div>

                        <Card className="flex flex-1 flex-col justify-between p-6 shadow-xs">
                            <div className="my-2 flex flex-1 items-center justify-center">
                                <InteractiveDonutChart data={statusDistribution} size={175} />
                            </div>

                            {/* Operational Health Quick Numbers */}
                            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                                <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                                    <div className="text-[11px] font-medium text-slate-500">Katalog Layanan</div>
                                    <div className="font-display text-lg font-bold text-slate-900">
                                        <AnimatedNumber value={stats.total_layanan ?? 0} />
                                    </div>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-2.5 text-center">
                                    <div className="text-[11px] font-medium text-slate-500">Metode Bayar</div>
                                    <div className="font-display text-lg font-bold text-slate-900">
                                        <AnimatedNumber value={stats.metode_aktif ?? 0} />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </motion.div>

                    {/* Action Hub & Command Shortcuts */}
                    <div>
                        <div className="mb-3">
                            <h2 className="font-display text-base font-bold text-slate-900">
                                Pusat Tugas & Akses Menu
                            </h2>
                            <p className="text-xs text-slate-500">Akses cepat menu pengelolaan dan verifikasi</p>
                        </div>

                        <div className="grid gap-2.5 sm:grid-cols-2">
                            <ActionTile
                                label="Verifikasi Layanan"
                                meta="Persetujuan berkas & syarat"
                                icon={ClipboardCheck}
                                href={navHref('rtpu.verify.layanan', {}, role)}
                                badge={stats.menunggu_verifikasi ?? 0}
                                index={0}
                            />

                            <ActionTile
                                label="Verifikasi Pembayaran"
                                meta="Validasi bukti transfer masuk"
                                icon={Wallet}
                                href={navHref('rtpu.verify.bayar', {}, role)}
                                badge={stats.verifikasi_bayar ?? 0}
                                index={1}
                            />

                            <ActionTile
                                label="Update Status Layanan"
                                meta="Pantau pelaksanaan layanan"
                                icon={Activity}
                                href={navHref('rtpu.status', {}, role)}
                                badge={stats.diproses ?? 0}
                                index={2}
                            />

                            <ActionTile
                                label="Kelola Katalog & Tarif"
                                meta="Portofolio layanan & paket opsi"
                                icon={Package}
                                href={navHref('rtpu.layanan', {}, role)}
                                index={3}
                            />

                            <ActionTile
                                label="Metode Pembayaran"
                                meta="Rekening bank & kanal bayar"
                                icon={CreditCard}
                                href={navHref('rtpu.metode', {}, role)}
                                index={4}
                            />

                            <ActionTile
                                label="Riwayat & Rekapitulasi"
                                meta="Arsip jejak rekam pengajuan"
                                icon={History}
                                href={navHref('rtpu.riwayat', {}, role)}
                                index={5}
                            />
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════ */}
                {/* 5. INTERACTIVE RECENT PENGAJUAN DATA HUB               */}
                {/* ══════════════════════════════════════════════════════ */}
                <motion.div
                    initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduce ? 0 : 0.45, delay: 0.3, ease: EASE }}
                    className="mb-6"
                >
                    <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="font-display text-base font-bold text-slate-900">
                                Antrean & Pengajuan Terbaru
                            </h2>
                            <p className="text-xs text-slate-500">
                                Monitoring riwayat permohonan layanan yang masuk ke RTPU
                            </p>
                        </div>

                        <Link
                            href={navHref('rtpu.riwayat', {}, role)}
                            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:-translate-y-px"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            <History className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                            <span>Buka Riwayat Penuh</span>
                        </Link>
                    </div>

                    <Card className="overflow-hidden shadow-xs">
                        {/* Search and Tab Filter Bar */}
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
                            {/* Filter tabs */}
                            <div className="flex flex-wrap items-center gap-1.5">
                                {[
                                    { key: 'all', label: 'Semua', count: recentPengajuan.length },
                                    {
                                        key: 'action_needed',
                                        label: 'Perlu Tindakan',
                                        count: recentPengajuan.filter((p) =>
                                            ['Diajukan', 'Menunggu Verifikasi Pembayaran'].includes(p.status)
                                        ).length,
                                    },
                                    {
                                        key: 'in_progress',
                                        label: 'Sedang Berjalan',
                                        count: recentPengajuan.filter((p) =>
                                            ['Diproses', 'Menunggu Pembayaran'].includes(p.status)
                                        ).length,
                                    },
                                    {
                                        key: 'completed',
                                        label: 'Selesai',
                                        count: recentPengajuan.filter((p) => p.status === 'Selesai').length,
                                    },
                                ].map((tab) => {
                                    const active = selectedTab === tab.key;
                                    return (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            onClick={() => setSelectedTab(tab.key)}
                                            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                                active
                                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                            }`}
                                        >
                                            <span>{tab.label}</span>
                                            <span
                                                className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                                                    active ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/70 text-slate-600'
                                                }`}
                                            >
                                                {tab.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Search box */}
                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari kode, nama, layanan..."
                                    className="w-full rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs placeholder:text-slate-400 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                                />
                            </div>
                        </div>

                        {/* List items */}
                        {filteredPengajuan.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                    <ClipboardCheck className="h-7 w-7" />
                                </span>
                                <p className="text-sm font-bold text-slate-800">Tidak ada pengajuan ditemukan</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {searchQuery ? 'Coba ubah kata kunci pencarian Anda.' : 'Belum ada data pengajuan pada filter ini.'}
                                </p>
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="mt-3 text-xs font-semibold text-[var(--color-accent)] hover:underline"
                                    >
                                        Hapus Pencarian
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3">Kode & Pemohon</th>
                                            <th className="px-5 py-3">Layanan Diminta</th>
                                            <th className="px-5 py-3">Estimasi Biaya</th>
                                            <th className="px-5 py-3">Tanggal</th>
                                            <th className="px-5 py-3">Status</th>
                                            <th className="px-5 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredPengajuan.map((p, i) => {
                                            const actionUrl = p.action?.routeKey ? navHref(p.action.routeKey, {}, role) : '#';
                                            const initials = p.customer
                                                ? p.customer
                                                      .split(' ')
                                                      .map((w) => w[0])
                                                      .slice(0, 2)
                                                      .join('')
                                                      .toUpperCase()
                                                : 'C';

                                            return (
                                                <tr
                                                    key={p.id}
                                                    className="transition-colors hover:bg-slate-50/80"
                                                >
                                                    {/* Code & Customer */}
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-extrabold text-slate-700">
                                                                {initials}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="font-mono text-xs font-bold text-slate-900">
                                                                    {p.code}
                                                                </div>
                                                                <div className="truncate text-xs text-slate-600 font-medium">
                                                                    {p.customer}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Layanan */}
                                                    <td className="px-5 py-3.5">
                                                        <div className="max-w-[220px]">
                                                            <div className="truncate text-xs font-bold text-slate-800">
                                                                {p.layanan}
                                                            </div>
                                                            <span className="inline-block mt-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 capitalize">
                                                                {p.tipe ?? 'Layanan'}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Total */}
                                                    <td className="px-5 py-3.5 text-xs font-semibold text-slate-900">
                                                        {p.total_formatted ?? (p.total ? `Rp ${p.total.toLocaleString('id-ID')}` : '-')}
                                                    </td>

                                                    {/* Date */}
                                                    <td className="px-5 py-3.5 text-xs text-slate-500">
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="h-3 w-3 text-slate-400" />
                                                            <span>{p.date}</span>
                                                        </div>
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-5 py-3.5">
                                                        <StatusBadge status={p.status} label={p.status} />
                                                    </td>

                                                    {/* Action button */}
                                                    <td className="px-5 py-3.5 text-right">
                                                        <Link
                                                            href={actionUrl}
                                                            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold transition-all hover:-translate-y-px active:scale-98"
                                                            style={
                                                                ['Diajukan', 'Menunggu Verifikasi Pembayaran'].includes(p.status)
                                                                    ? {
                                                                          background: 'var(--color-accent)',
                                                                          color: '#ffffff',
                                                                          boxShadow: '0 2px 6px rgba(0, 153, 138, 0.25)',
                                                                      }
                                                                    : {
                                                                          background: 'var(--color-surface)',
                                                                          color: 'var(--color-ink)',
                                                                          border: '1px solid var(--color-border)',
                                                                      }
                                                            }
                                                        >
                                                            <span>{p.action?.label ?? 'Detail'}</span>
                                                            <ArrowUpRight className="h-3 w-3" />
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </motion.div>
            </FadeIn>
        </DashboardLayout>
    );
}

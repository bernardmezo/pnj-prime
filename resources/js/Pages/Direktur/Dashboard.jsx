import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    Award,
    CheckCircle2,
    Eye,
    History,
    Package,
    Search,
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

/* ───── Modern Metric KPI Card ───── */
function MetricKpiCard({ title, value, desc, icon: Icon, badge, tone = 'teal', href, actionLabel, index = 0 }) {
    const reduce = useReducedMotion();

    const themes = {
        teal: {
            topBar: 'linear-gradient(90deg, #00998a, #00bfa5)',
            iconBg: 'rgba(0, 153, 138, 0.12)',
            iconColor: '#007468',
            badgeBg: 'rgba(0, 153, 138, 0.1)',
            badgeColor: '#007468',
        },
        gold: {
            topBar: 'linear-gradient(90deg, #f2b134, #f59e0b)',
            iconBg: 'rgba(242, 177, 52, 0.18)',
            iconColor: '#c8860f',
            badgeBg: 'rgba(242, 177, 52, 0.15)',
            badgeColor: '#c8860f',
        },
        emerald: {
            topBar: 'linear-gradient(90deg, #10b981, #059669)',
            iconBg: 'rgba(16, 185, 129, 0.12)',
            iconColor: '#059669',
            badgeBg: 'rgba(16, 185, 129, 0.12)',
            badgeColor: '#059669',
        },
    };

    const t = themes[tone] ?? themes.teal;
    const Tag = href ? Link : 'div';

    return (
        <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.45, delay: reduce ? 0 : index * 0.08, ease: EASE }}
        >
            <Tag
                {...(href ? { href } : {})}
                className={`group relative flex h-full flex-col justify-between overflow-hidden rounded-[22px] border bg-white p-5 shadow-2xs transition-all duration-300 ${
                    href ? 'hover:-translate-y-1 hover:shadow-md' : ''
                }`}
                style={{ borderColor: 'var(--color-border)' }}
            >
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
function ActionTile({ label, meta, icon: Icon, href, badge, index = 0 }) {
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
                    {badge && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                            {badge}
                        </span>
                    )}
                    <ArrowUpRight className="h-4 w-4 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[var(--color-accent)]" />
                </div>
            </Link>
        </motion.div>
    );
}

export default function DirekturDashboard({ auth, stats = {}, recentProduk = [] }) {
    const role = auth?.user?.role;
    const reduce = useReducedMotion();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProduk = useMemo(() => {
        if (!searchQuery) return recentProduk;
        const q = searchQuery.toLowerCase();
        return (recentProduk ?? []).filter(
            (p) =>
                p.code?.toLowerCase().includes(q) ||
                p.name?.toLowerCase().includes(q) ||
                p.researcher?.toLowerCase().includes(q) ||
                p.status?.toLowerCase().includes(q)
        );
    }, [recentProduk, searchQuery]);

    const approvedRate = (stats.total_produk ?? 0) > 0 ? Math.round(((stats.produk_disetujui ?? 0) / stats.total_produk) * 100) : 0;

    return (
        <DashboardLayout title="Dashboard" breadcrumb="Direktur / Dashboard" activeKey="dashboard">
            <Head title="Dashboard Direktur · PNJ Prime" />
            <FadeIn>
                {/* ── Page Header ── */}
                <div className="mb-8">
                    <PageHeader
                        eyebrow="Direktur PNJ"
                        title={`Selamat datang, ${auth?.user?.name ?? 'Direktur'}!`}
                        desc="Pemantauan eksekutif terhadap hilirisasi riset produk unggulan dan layanan bisnis PNJ."
                    />
                </div>

                {/* ── Metric KPI Cards ── */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricKpiCard
                        title="Produk Unggulan"
                        value={stats.total_produk ?? 0}
                        icon={Award}
                        tone="teal"
                        index={0}
                    />
                    <MetricKpiCard
                        title="Produk Disetujui"
                        value={stats.produk_disetujui ?? 0}
                        icon={CheckCircle2}
                        tone="emerald"
                        badge={`${approvedRate}% Disetujui`}
                        index={1}
                    />
                    <MetricKpiCard
                        title="Total Layanan"
                        value={stats.total_layanan ?? 0}
                        icon={Package}
                        tone="teal"
                        index={2}
                    />
                    <MetricKpiCard
                        title="Layanan Aktif"
                        value={stats.layanan_aktif ?? 0}
                        icon={Activity}
                        tone="gold"
                        badge={(stats.layanan_aktif ?? 0) > 0 ? 'Sedang Berjalan' : null}
                        index={3}
                    />
                </div>

                {/* ── Recent Produk Unggulan Table ── */}
                <motion.div
                    initial={{ opacity: 0, y: reduce ? 0 : 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduce ? 0 : 0.45, delay: 0.25, ease: EASE }}
                    className="mb-6"
                >
                    <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="font-display text-base font-bold text-slate-900">
                                Produk Unggulan Terbaru
                            </h2>
                            <p className="text-xs text-slate-500">
                                Portofolio riset dan hilirisasi terkini dari sivitas akademika
                            </p>
                        </div>

                        <Link
                            href={navHref('direktur.monitor', {}, role)}
                            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:-translate-y-px"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            <Eye className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                            <span>Buka Pemantauan Penuh</span>
                        </Link>
                    </div>

                    <Card className="overflow-hidden shadow-2xs">
                        {/* Search Bar */}
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
                            <span className="text-xs font-semibold text-slate-600">
                                Menampilkan {filteredProduk.length} produk unggulan terbaru
                            </span>

                            <div className="relative w-full sm:w-64">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari kode, produk, peneliti..."
                                    className="w-full rounded-full border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs placeholder:text-slate-400 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                                />
                            </div>
                        </div>

                        {filteredProduk.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                    <Award className="h-6 w-6" />
                                </span>
                                <p className="text-sm font-bold text-slate-800">Belum ada data produk</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {searchQuery ? 'Tidak ada hasil yang cocok dengan pencarian.' : 'Belum ada produk unggulan yang didaftarkan.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3">Kode</th>
                                            <th className="px-5 py-3">Nama Produk Unggulan</th>
                                            <th className="px-5 py-3">Peneliti</th>
                                            <th className="px-5 py-3">Tanggal</th>
                                            <th className="px-5 py-3">Status</th>
                                            <th className="px-5 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredProduk.map((p) => (
                                            <tr key={p.id} className="transition-colors hover:bg-slate-50/80">
                                                <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-900">
                                                    {p.code}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                                                        {p.name}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-slate-600">
                                                    {p.researcher ?? '-'}
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-slate-500">
                                                    {p.date}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <StatusBadge status={p.status} label={p.status} />
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <Link
                                                        href={navHref('direktur.monitor', {}, role)}
                                                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:-translate-y-px"
                                                    >
                                                        <span>Pantau</span>
                                                        <ArrowRight className="h-3 w-3" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
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

import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    Activity,
    ArrowRight,
    ArrowUpRight,
    CheckCircle2,
    ClipboardCheck,
    CreditCard,
    History,
    Layers,
    Package,
    Search,
    Wallet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EASE, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

/* ───── Clean KPI Card ───── */
function MetricKpiCard({ title, value = 0, icon: Icon, badge, tone = 'teal', href, actionLabel }) {
    const reduce = useReducedMotion();

    const themes = {
        teal: {
            topBar: 'var(--color-accent)',
            iconBg: 'var(--color-accent-tint)',
            iconColor: 'var(--color-ink)',
        },
        gold: {
            topBar: '#f59e0b',
            iconBg: 'rgba(245, 158, 11, 0.12)',
            iconColor: '#d97706',
        },
        emerald: {
            topBar: '#10b981',
            iconBg: 'rgba(16, 185, 129, 0.12)',
            iconColor: '#059669',
        },
    };

    const t = themes[tone] ?? themes.teal;
    const Tag = href ? Link : 'div';

    return (
        <Tag
            {...(href ? { href } : {})}
            className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-5 shadow-2xs transition-all duration-200 ${
                href ? 'hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300' : ''
            }`}
            style={{ borderColor: 'var(--color-border)' }}
        >
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: t.topBar }} />

            <div className="flex items-start justify-between gap-3">
                <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                    style={{ background: t.iconBg, color: t.iconColor }}
                >
                    <Icon className="h-5 w-5" />
                </span>

                {badge && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        {badge}
                    </span>
                )}
            </div>

            <div className="mt-4">
                <div className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
                    {value}
                </div>
                <h3 className="mt-1 text-sm font-semibold text-slate-700">{title}</h3>
            </div>

            {href && actionLabel && (
                <div className="mt-3 flex items-center gap-1 border-t border-slate-100 pt-2.5 text-xs font-semibold" style={{ color: t.iconColor }}>
                    <span>{actionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                </div>
            )}
        </Tag>
    );
}

export default function RtpuDashboard({
    auth,
    stats = {},
    recentPengajuan = [],
}) {
    const role = auth?.user?.role;
    const [searchQuery, setSearchQuery] = useState('');

    const filteredPengajuan = useMemo(() => {
        if (!searchQuery) return recentPengajuan;
        const q = searchQuery.toLowerCase();
        return (recentPengajuan ?? []).filter(
            (p) =>
                p.code?.toLowerCase().includes(q) ||
                p.customer?.toLowerCase().includes(q) ||
                p.layanan?.toLowerCase().includes(q) ||
                p.status?.toLowerCase().includes(q)
        );
    }, [recentPengajuan, searchQuery]);

    const pendingLayanan = stats.menunggu_verifikasi ?? 0;
    const pendingBayar = stats.verifikasi_bayar ?? 0;

    return (
        <DashboardLayout title="Dashboard" breadcrumb="Admin RTPU / Dashboard" activeKey="dashboard">
            <Head title="Dashboard Admin RTPU · PNJ Prime" />
            <FadeIn>
                {/* ── Page Header ── */}
                <div className="mb-6">
                    <PageHeader
                        eyebrow="Admin RTPU"
                        title={`Selamat datang, ${auth?.user?.name ?? 'Admin'}!`}
                        desc="Pantau antrean pengajuan dan verifikasi alur layanan secara efisien."
                    />
                </div>

                {/* ── 4 Focused KPI Metrics ── */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricKpiCard
                        title="Verifikasi Layanan"
                        value={pendingLayanan}
                        icon={ClipboardCheck}
                        tone="gold"
                        badge={pendingLayanan > 0 ? `${pendingLayanan} Perlu Tindakan` : null}
                        href={navHref('rtpu.verify.layanan', {}, role)}
                        actionLabel="Tinjau Berkas"
                    />

                    <MetricKpiCard
                        title="Verifikasi Pembayaran"
                        value={pendingBayar}
                        icon={Wallet}
                        tone="gold"
                        badge={pendingBayar > 0 ? `${pendingBayar} Perlu Dicek` : null}
                        href={navHref('rtpu.verify.bayar', {}, role)}
                        actionLabel="Periksa Bukti"
                    />

                    <MetricKpiCard
                        title="Pengerjaan Aktif"
                        value={stats.diproses ?? 0}
                        icon={Activity}
                        tone="teal"
                        href={navHref('rtpu.status', {}, role)}
                        actionLabel="Kelola Status"
                    />

                    <MetricKpiCard
                        title="Layanan Selesai"
                        value={stats.selesai ?? 0}
                        icon={CheckCircle2}
                        tone="emerald"
                        href={navHref('rtpu.riwayat', {}, role)}
                        actionLabel="Lihat Riwayat"
                    />
                </div>

                {/* ── Submissions Queue ── */}
                <div className="mb-6">
                    <div className="mb-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="font-display text-base font-bold text-slate-900">
                                Antrean Pengajuan Layanan
                            </h2>
                            <p className="text-xs text-slate-500">
                                Berkas permohonan dan transaksi terbaru yang masuk
                            </p>
                        </div>

                        <Link
                            href={navHref('rtpu.riwayat', {}, role)}
                            className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full border bg-white px-4 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:-translate-y-px"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            <History className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                            <span>Buka Riwayat Penuh</span>
                        </Link>
                    </div>

                    <Card className="overflow-hidden shadow-xs">
                        {/* Search Bar */}
                        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
                            <span className="text-xs font-semibold text-slate-600">
                                {filteredPengajuan.length} data pengajuan
                            </span>

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

                        {filteredPengajuan.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 text-center">
                                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                                    <ClipboardCheck className="h-6 w-6" />
                                </span>
                                <p className="text-sm font-bold text-slate-800">Tidak ada pengajuan ditemukan</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {searchQuery ? 'Tidak ada hasil yang sesuai dengan filter pencarian.' : 'Belum ada antrean pengajuan saat ini.'}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                                        <tr>
                                            <th className="px-5 py-3">Kode & Pemohon</th>
                                            <th className="px-5 py-3">Layanan</th>
                                            <th className="px-5 py-3">Biaya</th>
                                            <th className="px-5 py-3">Tanggal</th>
                                            <th className="px-5 py-3">Status</th>
                                            <th className="px-5 py-3 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredPengajuan.map((p) => {
                                            const isActionNeeded = ['Diajukan', 'Menunggu Verifikasi Pembayaran'].includes(p.status);
                                            const targetUrl = p.action?.url ?? navHref('rtpu.verify.layanan', {}, role);

                                            return (
                                                <tr key={p.id} className="transition hover:bg-slate-50/70">
                                                    <td className="px-5 py-3.5">
                                                        <span className="font-mono text-xs font-bold text-slate-900">{p.code}</span>
                                                        <span className="block text-xs text-slate-500">{p.customer}</span>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <span className="font-medium text-slate-800 text-xs sm:text-sm">{p.layanan}</span>
                                                        <span className="block text-[11px] uppercase tracking-wider text-slate-400">{p.tipe}</span>
                                                    </td>
                                                    <td className="px-5 py-3.5 font-mono text-xs text-slate-700">
                                                        {p.total_formatted || '-'}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs text-slate-500">
                                                        {p.date}
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <StatusBadge status={p.status} />
                                                    </td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <Link
                                                            href={targetUrl}
                                                            className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                                                isActionNeeded
                                                                    ? 'bg-[var(--color-accent)] text-white shadow-2xs hover:bg-[var(--color-accent-hover)]'
                                                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                            }`}
                                                        >
                                                            <span>{isActionNeeded ? 'Tinjau' : 'Detail'}</span>
                                                            <ArrowRight className="h-3 w-3" />
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
                </div>
            </FadeIn>
        </DashboardLayout>
    );
}

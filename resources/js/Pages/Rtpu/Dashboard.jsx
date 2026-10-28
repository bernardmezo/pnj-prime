import { Head, router } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import {
    ActivityList,
    EmptyState,
    PageHeader,
    Panel,
    StatRow,
    StatusDot,
} from '@/Components/Dashboard/SharedDashboard';
import { href as navHref } from '@/lib/nav';

// Format date to "28 Okt 2026"
function formatDateId(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return dateStr;
    }
}

export default function RtpuDashboard({
    auth,
    stats = {},
    recentPengajuan = [],
}) {
    const role = auth?.user?.role;
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('perlu_tindakan'); // Default to "Perlu tindakan"

    const pendingLayanan = stats.menunggu_verifikasi ?? 0;
    const pendingBayar = stats.verifikasi_bayar ?? 0;
    const inProgress = stats.diproses ?? 0;
    const completed = stats.selesai ?? 0;

    // Filter by tab + search query, and sort rows needing action to top
    const filteredPengajuan = useMemo(() => {
        let list = [...(recentPengajuan ?? [])];

        // Sort rows needing action to top
        list.sort((a, b) => {
            const aAction = ['Diajukan', 'Menunggu Verifikasi Pembayaran'].includes(a.status);
            const bAction = ['Diajukan', 'Menunggu Verifikasi Pembayaran'].includes(b.status);
            if (aAction && !bAction) return -1;
            if (!aAction && bAction) return 1;
            return 0;
        });

        // Tab filter
        if (activeTab === 'perlu_tindakan') {
            list = list.filter((p) => ['Diajukan', 'Menunggu Verifikasi Pembayaran'].includes(p.status));
        } else if (activeTab === 'diproses') {
            list = list.filter((p) => ['Diproses', 'Menunggu Pembayaran'].includes(p.status));
        } else if (activeTab === 'selesai') {
            list = list.filter((p) => p.status === 'Selesai');
        }

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            list = list.filter(
                (p) =>
                    p.code?.toLowerCase().includes(q) ||
                    p.customer?.toLowerCase().includes(q) ||
                    p.layanan?.toLowerCase().includes(q) ||
                    p.status?.toLowerCase().includes(q)
            );
        }

        return list;
    }, [recentPengajuan, activeTab, searchQuery]);

    // 5 Most recent events for "Aktivitas terbaru" list
    const recentActivities = useMemo(() => {
        return (recentPengajuan ?? []).slice(0, 5).map((p) => {
            const dateStr = formatDateId(p.date);
            const timeStr = p.time ?? '18:00';
            return {
                id: p.id,
                text: `${p.customer} mengajukan ${p.layanan}`,
                timestamp: `${dateStr}, ${timeStr}`,
            };
        });
    }, [recentPengajuan]);

    const handleRowClick = (p) => {
        const targetUrl = p.action?.url ?? (p.action?.routeKey ? navHref(p.action.routeKey, {}, role) : navHref('rtpu.verify.layanan', {}, role));
        if (targetUrl && targetUrl !== '#') {
            router.visit(targetUrl);
        }
    };

    const statItems = [
        {
            label: 'Perlu verifikasi',
            value: pendingLayanan,
            needsAction: true,
            highlightBar: true,
            helper: pendingLayanan > 0 ? 'menunggu Anda' : null,
        },
        {
            label: 'Perlu cek pembayaran',
            value: pendingBayar,
            helper: pendingBayar > 0 ? 'menunggu konfirmasi' : null,
        },
        {
            label: 'Sedang diproses',
            value: inProgress,
        },
        {
            label: 'Selesai',
            value: completed,
        },
    ];

    return (
        <DashboardLayout title="Dashboard" activeKey="dashboard">
            <Head title="Dashboard · PNJ Prime" />

            <div className="space-y-6">
                {/* 1. Page Header */}
                <PageHeader title="Dashboard" />

                {/* 2. Summary Panel */}
                <Panel>
                    <StatRow stats={statItems} />
                </Panel>


                {/* 3. Queue: Dedicated white panel (12px radius, 1px border) */}
                <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 sm:p-8 space-y-5">
                    {/* Heading & Search row */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="text-base font-semibold text-[#111827]">
                                Antrean pengajuan
                            </h2>
                            <span className="text-xs text-slate-400 tabular-nums">
                                ({filteredPengajuan.length})
                            </span>
                        </div>

                        {/* Search input: 6px radius, not a pill */}
                        <div className="relative w-full sm:w-64">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari pemohon, kode, layanan…"
                                className="w-full rounded-[6px] border border-[#E5E7EB] bg-white py-1.5 pl-8 pr-3 text-xs text-[#111827] placeholder:text-slate-400 outline-none transition focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                            />
                        </div>
                    </div>

                    {/* Filter tabs: Underlined text with active 2px teal underline */}
                    <div className="flex gap-6 border-b border-[#E5E7EB] text-sm">
                        {[
                            { key: 'perlu_tindakan', label: 'Perlu tindakan' },
                            { key: 'semua', label: 'Semua' },
                            { key: 'diproses', label: 'Diproses' },
                            { key: 'selesai', label: 'Selesai' },
                        ].map((t) => {
                            const isTabActive = activeTab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => setActiveTab(t.key)}
                                    className={`relative pb-3 text-xs sm:text-sm transition-colors ${
                                        isTabActive
                                            ? 'font-semibold text-[var(--color-accent)]'
                                            : 'font-normal text-slate-500 hover:text-slate-900'
                                    }`}
                                >
                                    <span>{t.label}</span>
                                    {isTabActive && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-accent)]" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Table inside panel: 72px row height, 14px main text, 12px muted, 3px amber left accent on action rows */}
                    {filteredPengajuan.length === 0 ? (
                        <div className="py-16 text-center text-sm text-slate-500">
                            {activeTab === 'perlu_tindakan' && !searchQuery
                                ? 'Tidak ada pengajuan yang perlu ditindaklanjuti.'
                                : 'Tidak ada pengajuan ditemukan.'}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-xs text-slate-500">
                                        <th className="py-2.5 px-3 font-normal">Pemohon</th>
                                        <th className="py-2.5 px-3 font-normal">Layanan</th>
                                        <th className="py-2.5 px-3 font-normal">Tanggal</th>
                                        <th className="py-2.5 px-3 text-right font-normal">Biaya</th>
                                        <th className="py-2.5 px-3 font-normal">Status</th>
                                        <th className="py-2.5 px-3 text-right font-normal">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E5E7EB]">
                                    {filteredPengajuan.map((p) => {
                                        const needsVerify = p.status === 'Diajukan';
                                        const needsPaymentCheck = p.status === 'Menunggu Verifikasi Pembayaran';
                                        const isActionRequired = needsVerify || needsPaymentCheck;
                                        const actionLabel = needsVerify ? 'Tinjau' : needsPaymentCheck ? 'Periksa' : null;

                                        return (
                                            <tr
                                                key={p.id}
                                                onClick={() => handleRowClick(p)}
                                                className={`h-[72px] cursor-pointer transition-colors hover:bg-[#F9FAFB] relative ${
                                                    isActionRequired ? 'border-l-[3px] border-l-amber-500' : ''
                                                }`}
                                            >
                                                {/* Pemohon */}
                                                <td className="py-3 px-3">
                                                    <span className="block text-sm font-medium text-[#111827]">{p.customer}</span>
                                                    <span className="block text-xs text-slate-400 mt-0.5">{p.code}</span>
                                                </td>

                                                {/* Layanan */}
                                                <td className="py-3 px-3">
                                                    <span className="block text-sm font-medium text-[#111827]">{p.layanan}</span>
                                                    <span className="block text-xs text-slate-400 capitalize mt-0.5">{p.tipe}</span>
                                                </td>

                                                {/* Tanggal */}
                                                <td className="py-3 px-3 tabular-nums text-xs text-slate-500 whitespace-nowrap">
                                                    {formatDateId(p.date)}
                                                </td>

                                                {/* Biaya (right-aligned, tabular-nums) */}
                                                <td className="py-3 px-3 text-right tabular-nums text-sm font-medium text-[#111827]">
                                                    {p.total ? `Rp ${Number(p.total).toLocaleString('id-ID')}` : '-'}
                                                </td>

                                                {/* Status (8px dot + text) */}
                                                <td className="py-3 px-3">
                                                    <StatusDot status={p.status} />
                                                </td>

                                                {/* Aksi */}
                                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                                    {isActionRequired ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRowClick(p);
                                                            }}
                                                            className="inline-flex h-8 items-center justify-center rounded-[6px] border border-[var(--color-accent)] px-3 text-xs font-semibold text-[var(--color-accent)] transition hover:bg-teal-50"
                                                        >
                                                            {actionLabel}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRowClick(p);
                                                            }}
                                                            className="text-xs text-slate-500 hover:text-slate-800 transition"
                                                        >
                                                            Lihat
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer directly below content */}
                    <div className="pt-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <span className="text-slate-500">
                            {activeTab === 'perlu_tindakan'
                                ? `${filteredPengajuan.length} pengajuan perlu tindakan`
                                : `Menampilkan ${filteredPengajuan.length} pengajuan`}
                        </span>

                        <a
                            href={navHref('rtpu.riwayat', {}, role)}
                            className="font-medium text-[var(--color-accent)] hover:underline transition"
                        >
                            {activeTab === 'perlu_tindakan' && (recentPengajuan.length - filteredPengajuan.length > 0)
                                ? `Lihat ${recentPengajuan.length - filteredPengajuan.length} riwayat lainnya →`
                                : 'Lihat semua riwayat →'}
                        </a>
                    </div>
                </div>

                {/* 4. Quiet second block: "Aktivitas terbaru" (plain list of last 5 events) */}
                {recentActivities.length > 0 && (
                    <div className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 sm:p-8">
                        <h3 className="text-sm font-semibold text-[#111827] mb-4">
                            Aktivitas terbaru
                        </h3>
                        <div className="divide-y divide-[#E5E7EB]">
                            {recentActivities.map((act) => (
                                <div
                                    key={act.id}
                                    className="py-3 flex items-center justify-between gap-4 text-xs first:pt-0 last:pb-0"
                                >
                                    <span className="text-slate-700 truncate">{act.text}</span>
                                    <span className="text-slate-400 shrink-0 tabular-nums">{act.timestamp}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}




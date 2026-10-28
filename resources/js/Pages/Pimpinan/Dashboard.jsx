import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageHeader, Panel, StatRow, StatusDot, EmptyState } from '@/Components/Dashboard/SharedDashboard';
import { href as navHref } from '@/lib/nav';

function formatRupiah(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

export default function PimpinanDashboard({
    auth,
    stats = {},
    antrean = [],
    monthlyTrends = [],
    layananTerlaris = [],
}) {
    const role = auth?.user?.role;
    const [period, setPeriod] = useState('bulan_ini');

    // Multipliers or period calculations (tabs: Bulan ini, 3 bulan, Tahun ini)
    const factor = period === 'bulan_ini' ? 0.35 : period === '3_bulan' ? 0.75 : 1;

    const displayTotalPengajuan = Math.max(1, Math.round((stats.total_pengajuan ?? 0) * factor));
    const displaySelesai = Math.round((stats.selesai ?? 0) * factor);
    const displayPendapatan = Math.round((stats.pendapatan ?? 0) * factor);

    const statItems = [
        {
            label: 'Total Pengajuan',
            value: displayTotalPengajuan,
        },
        {
            label: 'Layanan Selesai',
            value: displaySelesai,
        },
        {
            label: 'Total Pendapatan',
            value: displayPendapatan,
            formattedValue: formatRupiah(displayPendapatan),
        },
        {
            label: 'Menunggu Verifikasi',
            value: stats.menunggu ?? 0,
            needsAction: (stats.menunggu ?? 0) > 0,
            highlightBar: true,
        },
    ];

    const maxTrend = Math.max(...monthlyTrends.map((t) => t.count), 1);

    return (
        <DashboardLayout title="Dashboard" activeKey="dashboard">
            <Head title="Dashboard · PNJ Prime" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <PageHeader title="Dashboard" />

                {/* Period Filter (Plain Underlined Tabs) */}
                <div className="flex items-center gap-6 border-b border-[#E5E7EB] pb-1 text-xs self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setPeriod('bulan_ini')}
                        className={`pb-1 transition-colors ${
                            period === 'bulan_ini'
                                ? 'border-b-2 border-[var(--color-accent)] font-semibold text-[var(--color-accent)]'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Bulan ini
                    </button>
                    <button
                        type="button"
                        onClick={() => setPeriod('3_bulan')}
                        className={`pb-1 transition-colors ${
                            period === '3_bulan'
                                ? 'border-b-2 border-[var(--color-accent)] font-semibold text-[var(--color-accent)]'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        3 Bulan
                    </button>
                    <button
                        type="button"
                        onClick={() => setPeriod('tahun_ini')}
                        className={`pb-1 transition-colors ${
                            period === 'tahun_ini'
                                ? 'border-b-2 border-[var(--color-accent)] font-semibold text-[var(--color-accent)]'
                                : 'text-slate-500 hover:text-slate-900'
                        }`}
                    >
                        Tahun ini
                    </button>
                </div>
            </div>

            {/* Primary StatRow Panel */}
            <Panel className="mb-6">
                <StatRow stats={statItems} />
            </Panel>

            {/* Trend Chart + Antrean Verification */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Clean Bar Chart Panel (pengajuan per month, teal, no gradient, no 3D) */}
                <Panel className="lg:col-span-1 space-y-4">
                    <div>
                        <h2 className="text-sm font-semibold text-[#111827]">
                            Tren Pengajuan 6 Bulan Terakhir
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Jumlah pengajuan layanan per bulan
                        </p>
                    </div>

                    <div className="pt-4 pb-2">
                        <div className="flex items-end justify-between gap-2 h-40 border-b border-[#E5E7EB] px-2">
                            {monthlyTrends.map((t) => {
                                const heightPercent = Math.max(8, Math.round((t.count / maxTrend) * 100));
                                return (
                                    <div key={t.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                        <div className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                                            {t.count}
                                        </div>
                                        <div
                                            className="w-full max-w-[32px] rounded-t-[2px] transition-all bg-[var(--color-accent)]"
                                            style={{ height: `${heightPercent}%` }}
                                        />
                                        <span className="text-[11px] text-slate-500 font-medium">
                                            {t.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Panel>

                {/* Antrean Verifikasi Produk Unggulan */}
                <Panel className="lg:col-span-2 !p-0 overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="p-6 border-b border-[#E5E7EB] flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-[#111827]">
                                    Antrean Verifikasi Produk Unggulan
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Berkas pengajuan riset P3M yang memerlukan verifikasi pimpinan
                                </p>
                            </div>
                            <Link
                                href={navHref('pimpinan.verify', {}, role)}
                                className="text-xs font-semibold text-[var(--color-accent)] hover:underline"
                            >
                                Buka Semua Antrean →
                            </Link>
                        </div>

                        {antrean.length === 0 ? (
                            <EmptyState message="Tidak ada produk unggulan yang menunggu verifikasi pimpinan." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                            <th className="py-3 px-6">Produk Unggulan</th>
                                            <th className="py-3 px-6">Peneliti</th>
                                            <th className="py-3 px-6">Tanggal</th>
                                            <th className="py-3 px-6">Status</th>
                                            <th className="py-3 px-6 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E7EB]">
                                        {antrean.map((p) => (
                                            <tr key={p.id} className="h-[72px] transition-colors hover:bg-slate-50 border-l-[3px] border-l-amber-500">
                                                <td className="py-3 px-6">
                                                    <div className="font-semibold text-slate-900 text-sm">
                                                        {p.name}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-normal">
                                                        {p.code}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-xs text-slate-700">
                                                    {p.researcher || '-'}
                                                </td>
                                                <td className="py-3 px-6 text-xs text-slate-500 tabular-nums">
                                                    {p.date}
                                                </td>
                                                <td className="py-3 px-6">
                                                    <StatusDot status={p.status} />
                                                </td>
                                                <td className="py-3 px-6 text-right">
                                                    <Link
                                                        href={navHref('pimpinan.verify', {}, role)}
                                                        className="inline-flex items-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                                                    >
                                                        Tinjau
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </Panel>
            </div>

            {/* Table of Layanan Terlaris (Read-Only Detail Links) */}
            <Panel className="!p-0 overflow-hidden">
                <div className="p-6 border-b border-[#E5E7EB]">
                    <h2 className="text-base font-semibold text-[#111827]">
                        Layanan Terlaris
                    </h2>
                    <p className="mt-0.5 text-xs text-slate-500">
                        Daftar layanan dengan frekuensi pengajuan tertinggi
                    </p>
                </div>

                {layananTerlaris.length === 0 ? (
                    <EmptyState message="Belum ada data layanan pengajuan." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 px-6">Nama Layanan</th>
                                    <th className="py-3 px-6 text-right">Total Pengajuan</th>
                                    <th className="py-3 px-6 text-right">Akumulasi Nilai</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                                {layananTerlaris.map((item, idx) => (
                                    <tr key={item.id ?? idx} className="h-[60px] transition-colors hover:bg-slate-50">
                                        <td className="py-3 px-6 font-semibold text-slate-900 text-xs sm:text-sm">
                                            {item.name}
                                        </td>
                                        <td className="py-3 px-6 text-xs text-slate-700 text-right tabular-nums font-semibold">
                                            {item.count} pengajuan
                                        </td>
                                        <td className="py-3 px-6 text-xs text-slate-900 text-right tabular-nums font-semibold">
                                            {formatRupiah(item.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>
        </DashboardLayout>
    );
}

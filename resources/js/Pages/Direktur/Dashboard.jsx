import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageHeader, Panel, StatRow, EmptyState } from '@/Components/Dashboard/SharedDashboard';
import { href as navHref } from '@/lib/nav';

function formatRupiah(num) {
    return 'Rp ' + Number(num || 0).toLocaleString('id-ID');
}

export default function DirekturDashboard({
    auth,
    stats = {},
    monthlyTrends = [],
    topLayanan = [],
}) {
    const role = auth?.user?.role;

    const statItems = [
        {
            label: 'Total Pendapatan Layanan',
            value: stats.total_pendapatan ?? 0,
            formattedValue: formatRupiah(stats.total_pendapatan ?? 0),
        },
        {
            label: 'Layanan Selesai Dikerjakan',
            value: stats.total_selesai ?? 0,
        },
        {
            label: 'Pengajuan Sedang Berjalan',
            value: stats.sedang_berjalan ?? 0,
            needsAction: (stats.sedang_berjalan ?? 0) > 0,
            highlightBar: true,
        },
    ];

    const maxTrend = Math.max(...monthlyTrends.map((t) => t.count), 1);

    return (
        <DashboardLayout title="Dashboard" activeKey="dashboard">
            <Head title="Ringkasan Eksekutif · PNJ Prime" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                <PageHeader
                    title="Ringkasan Eksekutif"
                    subtitle="Laporan kinerja layanan bisnis dan hilirisasi produk Politeknik Negeri Jakarta"
                />
                <Link
                    href={navHref('direktur.monitor', {}, role)}
                    className="inline-flex items-center justify-center rounded-[6px] border border-[#E5E7EB] bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] self-start sm:self-auto"
                >
                    Buka Pemantauan Lengkap →
                </Link>
            </div>

            {/* Executive StatRow: 3 numbers */}
            <Panel className="mb-8">
                <StatRow stats={statItems} />
            </Panel>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Trend Chart Panel: 6 months activity */}
                <Panel className="lg:col-span-1 space-y-4">
                    <div>
                        <h2 className="text-base font-semibold text-[#111827]">
                            Tren Pengajuan Layanan
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Aktivitas permintaan layanan dalam 6 bulan terakhir
                        </p>
                    </div>

                    <div className="pt-6 pb-2">
                        <div className="flex items-end justify-between gap-3 h-48 border-b border-[#E5E7EB] px-2">
                            {monthlyTrends.map((t) => {
                                const heightPercent = Math.max(10, Math.round((t.count / maxTrend) * 100));
                                return (
                                    <div key={t.month} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                                        <div className="text-[11px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                                            {t.count}
                                        </div>
                                        <div
                                            className="w-full max-w-[36px] rounded-t-[3px] transition-all bg-[var(--color-accent)]"
                                            style={{ height: `${heightPercent}%` }}
                                        />
                                        <span className="text-xs text-slate-600 font-medium">
                                            {t.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Panel>

                {/* Top 5 Services by Revenue */}
                <Panel className="lg:col-span-2 !p-0 overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="p-6 border-b border-[#E5E7EB]">
                            <h2 className="text-base font-semibold text-[#111827]">
                                5 Layanan Teratas berdasarkan Pendapatan
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Unit layanan dengan kontribusi nilai penyelesaian tertinggi
                            </p>
                        </div>

                        {topLayanan.length === 0 ? (
                            <EmptyState message="Belum ada transaksi layanan yang selesai tercatat." />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                            <th className="py-3 px-6">Layanan</th>
                                            <th className="py-3 px-6">Kategori</th>
                                            <th className="py-3 px-6 text-right">Frekuensi</th>
                                            <th className="py-3 px-6 text-right">Total Pendapatan</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E7EB]">
                                        {topLayanan.map((item, idx) => (
                                            <tr key={item.id ?? idx} className="h-[72px] transition-colors hover:bg-slate-50">
                                                <td className="py-3 px-6">
                                                    <div className="font-semibold text-slate-900 text-sm">
                                                        {item.name}
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-normal">
                                                        Peringkat #{idx + 1}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-xs text-slate-600">
                                                    {item.category}
                                                </td>
                                                <td className="py-3 px-6 text-xs text-slate-700 text-right tabular-nums font-semibold">
                                                    {item.count} transaksi
                                                </td>
                                                <td className="py-3 px-6 text-sm text-slate-900 text-right tabular-nums font-semibold">
                                                    {formatRupiah(item.revenue)}
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
        </DashboardLayout>
    );
}

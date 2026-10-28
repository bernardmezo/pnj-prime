import React, { useMemo, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import PengajuanProdukModal from '@/Components/PengajuanProdukModal';
import { PageHeader, Panel, StatRow, StatusDot, EmptyState, ActivityList } from '@/Components/Dashboard/SharedDashboard';
import { href as navHref } from '@/lib/nav';

export default function P3mDashboard({ auth, stats = {}, daftar = [], recentActivities = [] }) {
    const role = auth?.user?.role;
    const [modalOpen, setModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredDaftar = useMemo(() => {
        if (!searchQuery) return daftar;
        const q = searchQuery.toLowerCase();
        return (daftar ?? []).filter(
            (p) =>
                p.code?.toLowerCase().includes(q) ||
                p.name?.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q) ||
                p.status?.toLowerCase().includes(q)
        );
    }, [daftar, searchQuery]);

    const statItems = [
        {
            label: 'Total Pengajuan',
            value: stats.total ?? 0,
        },
        {
            label: 'Sedang Diproses',
            value: stats.diproses ?? 0,
            needsAction: (stats.diproses ?? 0) > 0,
            highlightBar: true,
        },
        {
            label: 'Disetujui',
            value: stats.disetujui ?? 0,
        },
        {
            label: 'Ditolak / Batal',
            value: stats.ditolak ?? 0,
        },
    ];

    return (
        <DashboardLayout title="Dashboard" activeKey="dashboard">
            <Head title="Dashboard · PNJ Prime" />

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <PageHeader title="Dashboard" />
                <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="inline-flex items-center justify-center rounded-[6px] bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-hover)] self-start sm:self-auto"
                >
                    + Ajukan Produk Unggulan
                </button>
            </div>

            {/* StatRow */}
            <Panel className="mb-6">
                <StatRow stats={statItems} />
            </Panel>

            {/* Primary Panel: Queue of Items Awaiting Action / In Progress (Full Width) */}
            <Panel className="mb-6 !p-0 overflow-hidden">
                <div className="p-6 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold text-[#111827]">
                            Antrean Pengajuan Produk Riset
                        </h2>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Daftar produk unggulan yang sedang aktif dan memerlukan pemantauan
                        </p>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari kode, nama produk..."
                            className="w-full rounded-[6px] border border-[#E5E7EB] bg-white py-1.5 px-3 text-xs placeholder:text-slate-400 focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
                        />
                    </div>
                </div>

                {filteredDaftar.length === 0 ? (
                    <EmptyState message={searchQuery ? 'Tidak ada hasil yang sesuai filter pencarian.' : 'Tidak ada produk dalam antrean saat ini.'} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                                    <th className="py-3 px-6">Produk / Layanan</th>
                                    <th className="py-3 px-6">Kategori</th>
                                    <th className="py-3 px-6">Tanggal</th>
                                    <th className="py-3 px-6">Status</th>
                                    <th className="py-3 px-6 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                                {filteredDaftar.map((item) => {
                                    const isActionNeeded = item.status === 'Diajukan' || item.status === 'Revisi';
                                    return (
                                        <tr
                                            key={item.id}
                                            className={`relative h-[72px] transition-colors hover:bg-slate-50 ${
                                                isActionNeeded ? 'border-l-[3px] border-l-amber-500' : ''
                                            }`}
                                        >
                                            <td className="py-3 px-6">
                                                <div className="font-semibold text-slate-900 text-sm">
                                                    {item.name}
                                                </div>
                                                <div className="text-xs text-slate-400 font-normal">
                                                    {item.code}
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-xs text-slate-600">
                                                {item.category || '-'}
                                            </td>
                                            <td className="py-3 px-6 text-xs text-slate-500 tabular-nums">
                                                {item.date}
                                            </td>
                                            <td className="py-3 px-6">
                                                <StatusDot status={item.status} />
                                            </td>
                                            <td className="py-3 px-6 text-right">
                                                <Link
                                                    href={navHref('p3m.produk.show', { id: item.id }, role)}
                                                    className="inline-flex items-center rounded-[6px] border border-[#E5E7EB] bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                                                >
                                                    Tinjau
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Panel>

            {/* Secondary Panel: Recent Activity */}
            {recentActivities.length > 0 && (
                <ActivityList
                    title="Aktivitas Terakhir"
                    items={recentActivities}
                />
            )}

            <PengajuanProdukModal open={modalOpen} onClose={() => setModalOpen(false)} />
        </DashboardLayout>
    );
}

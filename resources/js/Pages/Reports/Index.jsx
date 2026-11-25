import React from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { EmptyState, PageHeader, Panel, StatRow } from '@/Components/Dashboard/SharedDashboard';

export default function ReportsIndex({ filter, summary, orders, audit_logs, top_services = [], revenue_breakdown = [] }) {
    const statItems = [
        {
            label: 'Total Pendapatan',
            value: summary?.total_revenue ?? 0,
            formattedValue: `Rp ${Number(summary?.total_revenue || 0).toLocaleString('id-ID')}`,
        },
        {
            label: 'Total Pajak (PPN)',
            value: summary?.total_tax ?? 0,
            formattedValue: `Rp ${Number(summary?.total_tax || 0).toLocaleString('id-ID')}`,
        },
        {
            label: 'Total Pesanan',
            value: summary?.total_orders ?? 0,
        },
        {
            label: 'Lunas Belum Selesai',
            value: summary?.paid_unfulfilled ?? 0,
        },
    ];

    return (
        <DashboardLayout title="Laporan & Audit Transaksi" activeKey="reports">
            <Head title="Laporan & Audit Transaksi" />

            <div className="space-y-6">
                <PageHeader
                    title="Laporan & Audit Transaksi"
                    subtitle="Ringkasan pendapatan dan aktivitas transaksi sistem"
                />

                <Panel>
                    <StatRow stats={statItems} />
                    <p className="mt-3 text-xs text-[var(--color-muted)]">Total Pendapatan dihitung dari pesanan berstatus lunas, diproses, atau selesai pada periode {filter?.start_date} sampai {filter?.end_date}. Pesanan menunggu pembayaran atau dibatalkan tidak dihitung.</p>
                </Panel>
                <Panel className="!p-0 overflow-hidden">
                    <div className="border-b border-[var(--color-border)] p-6">
                        <h2 className="text-base font-semibold text-[var(--color-ink)]">Rincian Total Pendapatan per Produk</h2>
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">Sumber angka Total Pendapatan di atas, dipecah per produk/layanan.</p>
                    </div>
                    {revenue_breakdown.length === 0 ? (
                        <EmptyState message="Belum ada pendapatan pada periode ini." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                        <th className="px-6 py-3">Nama Layanan</th>
                                        <th className="px-6 py-3 text-right">Jumlah Pesanan</th>
                                        <th className="px-6 py-3 text-right">Total Pendapatan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {revenue_breakdown.map((item, index) => (
                                        <tr key={index} className="h-[60px] transition-colors hover:bg-[var(--color-surface)]">
                                            <td className="px-6 py-3 text-xs font-semibold text-[var(--color-ink)] sm:text-sm">{item.name}</td>
                                            <td className="px-6 py-3 text-right text-xs font-semibold tabular-nums text-[var(--color-ink)]">{item.count} pesanan</td>
                                            <td className="px-6 py-3 text-right text-xs font-semibold tabular-nums text-[var(--color-ink)]">Rp {Number(item.total ?? 0).toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
                <Panel className="!p-0 overflow-hidden">
                    <div className="border-b border-[var(--color-border)] p-6">
                        <h2 className="text-base font-semibold text-[var(--color-ink)]">Layanan Terlaris</h2>
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">Peringkat berdasarkan jumlah pengajuan per layanan yang dibuat pada {filter?.start_date} sampai {filter?.end_date}, termasuk semua status. Akumulasi nilai adalah jumlah nilai pengajuan, bukan pendapatan yang sudah dibayar.</p>
                    </div>
                    {top_services.length === 0 ? (
                        <EmptyState message="Belum ada data layanan pengajuan pada periode ini." />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                        <th className="px-6 py-3">Nama Layanan</th>
                                        <th className="px-6 py-3 text-right">Total Pengajuan</th>
                                        <th className="px-6 py-3 text-right">Akumulasi Nilai</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border)]">
                                    {top_services.map((item) => (
                                        <tr key={item.id} className="h-[60px] transition-colors hover:bg-[var(--color-surface)]">
                                            <td className="px-6 py-3 text-xs font-semibold text-[var(--color-ink)] sm:text-sm">{item.name}</td>
                                            <td className="px-6 py-3 text-right text-xs font-semibold tabular-nums text-[var(--color-ink)]">{item.count} pengajuan</td>
                                            <td className="px-6 py-3 text-right text-xs font-semibold tabular-nums text-[var(--color-ink)]">Rp {Number(item.total ?? 0).toLocaleString('id-ID')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Panel>
            </div>
        </DashboardLayout>
    );
}

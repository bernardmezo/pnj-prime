import React from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageHeader, Panel, EmptyState } from '@/Components/Dashboard/SharedDashboard';

export default function PimpinanPengajuanPage({ antrean, selected }) {
    return (
        <DashboardLayout title="Verifikasi Pengajuan Sewa (Pimpinan)" activeKey="pengajuan">
            <Head title="Verifikasi Pengajuan Sewa (Pimpinan)" />

            <div className="space-y-6">
                <PageHeader
                    title="Verifikasi Pengajuan Sewa Fasilitas & Alat"
                    subtitle="Tinjau pengajuan sewa fasilitas dan alat dari customer"
                />

                <Panel className="!p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                    <th className="py-3.5 px-6">Kode</th>
                                    <th className="py-3.5 px-6">Layanan</th>
                                    <th className="py-3.5 px-6">Pemesan</th>
                                    <th className="py-3.5 px-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {(antrean || []).length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-6">
                                            <EmptyState message="Tidak ada pengajuan sewa yang menunggu verifikasi." />
                                        </td>
                                    </tr>
                                ) : (
                                    (antrean || []).map((row) => (
                                        <tr key={row.id} className="h-[60px] transition-colors hover:bg-[var(--color-surface)]">
                                            <td className="py-3 px-6 text-sm font-semibold text-[var(--color-ink)]">
                                                {row.code}
                                            </td>
                                            <td className="py-3 px-6 text-sm text-[var(--color-ink)]">
                                                {row.layanan}
                                            </td>
                                            <td className="py-3 px-6 text-sm text-[var(--color-ink)]">
                                                {row.customer}
                                            </td>
                                            <td className="py-3 px-6 text-sm text-[var(--color-ink)]">
                                                {row.status}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Panel>
            </div>
        </DashboardLayout>
    );
}

import React from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageHeader, Panel, EmptyState } from '@/Components/Dashboard/SharedDashboard';

export default function TaxRatesIndex({ rates }) {
    return (
        <DashboardLayout title="Master Tarif Pajak" activeKey="tax-rates">
            <Head title="Master Tarif Pajak" />

            <div className="space-y-6">
                <PageHeader
                    title="Master Tarif Pajak"
                    subtitle="Kelola kode dan tarif pajak yang berlaku"
                />

                <Panel className="!p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                    <th className="py-3.5 px-6">Kode</th>
                                    <th className="py-3.5 px-6">Nama</th>
                                    <th className="py-3.5 px-6 text-right">Tarif (%)</th>
                                    <th className="py-3.5 px-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {(rates || []).length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="p-6">
                                            <EmptyState message="Belum ada tarif pajak yang terdaftar." />
                                        </td>
                                    </tr>
                                ) : (
                                    (rates || []).map((r) => (
                                        <tr key={r.id} className="h-[60px] transition-colors hover:bg-[var(--color-surface)]">
                                            <td className="py-3 px-6 text-sm font-semibold text-[var(--color-ink)]">
                                                {r.code}
                                            </td>
                                            <td className="py-3 px-6 text-sm text-[var(--color-ink)]">
                                                {r.name}
                                            </td>
                                            <td className="py-3 px-6 text-sm text-[var(--color-ink)] text-right tabular-nums">
                                                {r.rate}%
                                            </td>
                                            <td className="py-3 px-6">
                                                <span
                                                    className="inline-flex items-center gap-2 text-xs text-[var(--color-ink)]"
                                                >
                                                    <span
                                                        className="h-2 w-2 rounded-full"
                                                        style={{ background: r.is_active ? 'var(--color-accent)' : 'var(--color-muted)' }}
                                                        aria-hidden
                                                    />
                                                    {r.is_active ? 'Aktif' : 'Non-aktif'}
                                                </span>
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

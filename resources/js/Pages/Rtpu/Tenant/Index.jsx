import React from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageHeader, Panel, EmptyState } from '@/Components/Dashboard/SharedDashboard';

export default function TenantIndex({ tenants }) {
    return (
        <DashboardLayout title="Verifikasi Profil Tenant" activeKey="tenant">
            <Head title="Verifikasi Profil Tenant" />

            <div className="space-y-6">
                <PageHeader
                    title="Verifikasi Profil Tenant"
                    subtitle="Periksa profil perusahaan dan tenant yang mengajukan layanan"
                />

                <Panel className="!p-0 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="bg-[var(--color-surface)] border-b border-[var(--color-border)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                    <th className="py-3.5 px-6">Perusahaan</th>
                                    <th className="py-3.5 px-6">Kontak</th>
                                    <th className="py-3.5 px-6">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--color-border)]">
                                {(tenants || []).length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="p-6">
                                            <EmptyState message="Belum ada tenant yang perlu diverifikasi." />
                                        </td>
                                    </tr>
                                ) : (
                                    (tenants || []).map((t) => (
                                        <tr key={t.id} className="h-[60px] transition-colors hover:bg-[var(--color-surface)]">
                                            <td className="py-3 px-6 text-sm font-semibold text-[var(--color-ink)]">
                                                {t.company_name}
                                            </td>
                                            <td className="py-3 px-6 text-sm text-[var(--color-ink)]">
                                                {t.user_name} ({t.user_email})
                                            </td>
                                            <td className="py-3 px-6 text-sm text-[var(--color-ink)]">
                                                {t.verification_status}
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

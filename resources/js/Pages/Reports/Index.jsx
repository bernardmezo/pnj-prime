import React from 'react';
import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { PageHeader, Panel, StatRow } from '@/Components/Dashboard/SharedDashboard';

export default function ReportsIndex({ filter, summary, orders, audit_logs }) {
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
                </Panel>
            </div>
        </DashboardLayout>
    );
}

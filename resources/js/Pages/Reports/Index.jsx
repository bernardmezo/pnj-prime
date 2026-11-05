import React from 'react';
import { Head } from '@inertiajs/react';

export default function ReportsIndex({ filter, summary, orders, audit_logs }) {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Head title="Laporan & Audit Transaksi" />
            <h1 className="text-2xl font-bold mb-4">Laporan & Audit Transaksi</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white rounded-lg shadow border">
                    <div className="text-sm text-gray-500">Total Pendapatan</div>
                    <div className="text-xl font-bold">Rp {Number(summary?.total_revenue || 0).toLocaleString('id-ID')}</div>
                </div>
                <div className="p-4 bg-white rounded-lg shadow border">
                    <div className="text-sm text-gray-500">Total Pajak (PPN)</div>
                    <div className="text-xl font-bold">Rp {Number(summary?.total_tax || 0).toLocaleString('id-ID')}</div>
                </div>
                <div className="p-4 bg-white rounded-lg shadow border">
                    <div className="text-sm text-gray-500">Total Pesanan</div>
                    <div className="text-xl font-bold">{summary?.total_orders || 0}</div>
                </div>
            </div>
        </div>
    );
}

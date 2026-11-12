import React from 'react';
import { Head } from '@inertiajs/react';

export default function PimpinanPengajuanPage({ antrean, selected }) {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Head title="Verifikasi Pengajuan Sewa (Pimpinan)" />
            <h1 className="text-2xl font-bold mb-4">Verifikasi Pengajuan Sewa Fasilitas & Alat</h1>
            <div className="bg-white rounded-lg shadow overflow-hidden border">
                <table className="min-w-full divide-y divide-[var(--color-border)]">
                    <thead className="bg-[var(--color-surface)]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Kode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Layanan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Pemesan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {(antrean || []).map((row) => (
                            <tr key={row.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{row.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{row.layanan}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{row.customer}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{row.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

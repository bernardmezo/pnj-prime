import React from 'react';
import { Head } from '@inertiajs/react';

export default function TaxRatesIndex({ rates }) {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Head title="Master Tarif Pajak" />
            <h1 className="text-2xl font-bold mb-4">Master Tarif Pajak</h1>
            <div className="bg-white rounded-lg shadow overflow-hidden border">
                <table className="min-w-full divide-y divide-[var(--color-border)]">
                    <thead className="bg-[var(--color-surface)]">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Kode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Nama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Tarif (%)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                        {(rates || []).map((r) => (
                            <tr key={r.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{r.code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{r.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{r.rate}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{r.is_active ? 'Aktif' : 'Non-aktif'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

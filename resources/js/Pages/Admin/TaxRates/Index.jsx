import React from 'react';
import { Head } from '@inertiajs/react';

export default function TaxRatesIndex({ rates }) {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Head title="Master Tarif Pajak" />
            <h1 className="text-2xl font-bold mb-4">Master Tarif Pajak</h1>
            <div className="bg-white rounded-lg shadow overflow-hidden border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarif (%)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
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

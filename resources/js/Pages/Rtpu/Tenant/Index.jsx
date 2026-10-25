import React from 'react';
import { Head } from '@inertiajs/react';

export default function TenantIndex({ tenants }) {
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <Head title="Verifikasi Profil Tenant" />
            <h1 className="text-2xl font-bold mb-4">Verifikasi Profil Tenant</h1>
            <div className="bg-white rounded-lg shadow overflow-hidden border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Perusahaan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {(tenants || []).map((t) => (
                            <tr key={t.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{t.company_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{t.user_name} ({t.user_email})</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">{t.verification_status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

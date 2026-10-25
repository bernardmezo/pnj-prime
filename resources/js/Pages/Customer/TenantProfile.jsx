import React from 'react';
import { Head } from '@inertiajs/react';

export default function TenantProfilePage({ tenant, pdp_consented, pdp_consent_at }) {
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <Head title="Profil Usaha & Tenant" />
            <h1 className="text-2xl font-bold mb-4">Profil Usaha & Tenant</h1>
            <div className="bg-white p-6 rounded-lg shadow border space-y-4">
                <div>Status Validasi: <span className="font-semibold">{tenant?.verification_status || 'Belum Mengisi'}</span></div>
                {pdp_consented && (
                    <div className="text-sm text-green-700 bg-green-50 p-3 rounded">
                        Persetujuan PDP tercatat pada {pdp_consent_at}
                    </div>
                )}
            </div>
        </div>
    );
}

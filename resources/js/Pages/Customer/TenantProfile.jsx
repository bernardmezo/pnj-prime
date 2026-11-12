import React from 'react';
import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { PageHeader, Card } from '@/Components/ui';

export default function TenantProfilePage({ auth, tenant, pdp_consented, pdp_consent_at }) {
    return (
        <PublicLayout auth={auth}>
            <Head title="Profil Usaha & Tenant" />
            <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">
                <PageHeader
                    eyebrow="Customer"
                    title="Profil Usaha & Tenant"
                    desc="Informasi profil usaha dan status validasi tenant Anda."
                />

                <Card className="space-y-4 p-6 sm:p-8">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm text-[var(--color-muted)]">Status Validasi</span>
                        <span className="text-sm font-semibold text-[var(--color-ink)]">
                            {tenant?.verification_status || 'Belum Mengisi'}
                        </span>
                    </div>

                    {pdp_consented && (
                        <div className="rounded-xl border border-teal-200 bg-teal-50 p-3.5 text-sm text-teal-800">
                            Persetujuan PDP tercatat pada {pdp_consent_at}
                        </div>
                    )}
                </Card>
            </div>
        </PublicLayout>
    );
}

import { Head, router } from '@inertiajs/react';
import { Award, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import ReviewPanel from '@/Components/ReviewPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';

const CHECKLIST = [
    'Telah melalui verifikasi kurator RTPU',
    'Kelaikan legalitas & orisinalitas riset terjamin',
    'Kesiapan komersialisasi dan dampak hilirisasi optimal',
    'Persetujuan publikasi resmi ke katalog umum PNJ Prime',
];

export default function PimpinanVerifikasiProduk({ auth, products }) {
    const rows = products?.data || (Array.isArray(products) ? products : []);
    const [selId, setSelId] = useState(rows[0]?.id ?? null);
    const sel = rows.find((r) => r.id === selId) ?? rows[0] ?? null;

    const handleApprove = (catatan) => {
        if (!sel) return;
        router.patch(route('pimpinan.verify.produk.approve', sel.id), { catatan });
    };

    const handleReject = (catatan) => {
        if (!sel) return;
        router.patch(route('pimpinan.verify.produk.reject', sel.id), { catatan });
    };

    return (
        <DashboardLayout title="Persetujuan Final Produk" breadcrumb="Pimpinan RTPU / Verifikasi Produk" activeKey="verify">
            <Head title="Persetujuan Produk · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Pimpinan RTPU"
                    title="Persetujuan Final Publikasi Katalog"
                    desc="Menyetujui produk inovasi yang telah terverifikasi RTPU untuk dipublikasikan secara resmi ke katalog publik."
                />

                {rows.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="Tidak Ada Produk Menunggu Persetujuan"
                        desc="Seluruh produk terverifikasi telah ditindaklanjuti atau belum ada produk baru dari kurasi RTPU."
                    />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] items-start">
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-slate-500">
                                Antrean Persetujuan ({rows.length})
                            </h2>
                            <div className="space-y-2.5">
                                {rows.map((p) => {
                                    const isSelected = sel?.id === p.id;
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => setSelId(p.id)}
                                            aria-pressed={isSelected}
                                            className="block w-full rounded-[6px] border p-4 text-left transition"
                                            style={
                                                isSelected
                                                    ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-tint)' }
                                                    : { borderColor: 'var(--color-border)', background: 'var(--color-bg)' }
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold text-sm" style={{ color: 'var(--color-ink)' }}>
                                                    {p.nama ?? p.name}
                                                </span>
                                                <StatusBadge status={p.status_kurasi ?? 'verified_rtpu'} />
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                                                Kurator: {p.kurator?.name ?? 'Admin RTPU'}
                                            </p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {sel && (
                            <Card className="p-6">
                                <div className="border-b pb-4 mb-4">
                                    <h3 className="text-lg font-bold text-slate-900">{sel.nama ?? sel.name}</h3>
                                    <p className="text-sm text-slate-600 mt-1">{sel.deskripsi ?? sel.deskripsi_singkat ?? 'Tanpa deskripsi tambahan.'}</p>
                                    <div className="mt-3 flex gap-4 text-xs text-slate-500">
                                        <span>Status Kurasi: <strong className="text-slate-700">{sel.status_kurasi}</strong></span>
                                        <span>Unit Pengusul: <strong className="text-slate-700">{sel.unit?.name ?? 'Unit Riset PNJ'}</strong></span>
                                    </div>
                                </div>

                                <ReviewPanel
                                    title="Persetujuan Akhir Pimpinan"
                                    checklist={CHECKLIST}
                                    approveLabel="Setujui & Publikasikan ke Katalog"
                                    rejectLabel="Tolak / Minta Kaji Ulang"
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                />
                            </Card>
                        )}
                    </div>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}

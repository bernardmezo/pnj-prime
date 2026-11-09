import { Head, router } from '@inertiajs/react';
import { CheckCircle2, PackageCheck } from 'lucide-react';
import { useState } from 'react';
import ReviewPanel from '@/Components/ReviewPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';

const CHECKLIST = [
    'Kelengkapan deskripsi dan spesifikasi teknis inovasi',
    'Kesesuaian kategori dan unit pengusul',
    'Kelaikan komersialisasi dan dokumen pendukung HKI/riset',
    'Struktur penentuan harga estimasi atau opsi layanan',
];

export default function VerifikasiProduk({ auth, products }) {
    const rows = products?.data || (Array.isArray(products) ? products : []);
    const [selId, setSelId] = useState(rows[0]?.id ?? null);
    const sel = rows.find((r) => r.id === selId) ?? rows[0] ?? null;

    const handleVerify = (catatan) => {
        if (!sel) return;
        router.patch(route('rtpu.verify.produk.verify', sel.id), { catatan });
    };

    const handleReject = (catatan) => {
        if (!sel) return;
        router.patch(route('rtpu.verify.produk.reject', sel.id), { catatan });
    };

    return (
        <DashboardLayout title="Verifikasi Produk & Inovasi" breadcrumb="Admin RTPU / Kurasi Produk" activeKey="verify-layanan">
            <Head title="Kurasi Produk Riset · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Kurasi & Verifikasi Produk Inovasi"
                    desc="Telaah kelaikan produk inovasi unit riset sebelum diteruskan untuk persetujuan pimpinan."
                />

                {rows.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="Antrean Kurasi Kosong"
                        desc="Tidak ada produk inovasi yang menunggu telaah kurasi saat ini."
                    />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] items-start">
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-slate-500">
                                Antrean Produk Riset ({rows.length})
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
                                                <StatusBadge status={p.status_kurasi ?? 'pending_review'} />
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                                                {p.deskripsi_singkat ?? p.description ?? 'Produk riset civitas PNJ'}
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
                                        <span>Status: <strong className="text-slate-700">{sel.status_kurasi}</strong></span>
                                        <span>Unit: <strong className="text-slate-700">{sel.unit?.name ?? 'Unit Riset PNJ'}</strong></span>
                                    </div>
                                </div>

                                <ReviewPanel
                                    title="Formulir Kurasi RTPU"
                                    checklist={CHECKLIST}
                                    approveLabel="Verifikasi Produk (Loloskan ke Pimpinan)"
                                    rejectLabel="Kembalikan untuk Revisi"
                                    onApprove={handleVerify}
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

import { Head, router } from '@inertiajs/react';
import { Check, ClipboardCheck, Inbox, X } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, ConfirmModal, FadeIn, Field, PageHeader, StatCard, StatusBadge, inputClass, inputStyleProps } from '@/Components/ui';

export default function CurationIndex({ pending_products, stats }) {
    const [rejectId, setRejectId] = useState(null);
    const [reason, setReason] = useState('');
    const [processing, setProcessing] = useState(false);
    const rows = pending_products?.data ?? [];

    function handleApprove(productId) {
        router.patch(route('admin.curation.approve', productId));
    }

    function openReject(productId) {
        setRejectId(productId);
        setReason('');
    }

    function handleReject() {
        if (!reason.trim()) return;
        setProcessing(true);
        router.patch(route('admin.curation.reject', rejectId), { rejection_reason: reason }, {
            onFinish: () => {
                setProcessing(false);
                setRejectId(null);
            },
        });
    }

    return (
        <DashboardLayout title="Antrian Kurasi" breadcrumb="PNJ Prime / Kurasi">
            <Head title="Kurasi Produk — PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Tinjau Pengajuan dari Admin P3M"
                    desc="Setujui produk yang layak tampil di katalog, atau tolak disertai alasan yang jelas."
                />
                <div className="mb-6 grid grid-cols-3 gap-4">
                    <StatCard label="Menunggu" value={stats?.pending ?? 0} icon={Inbox} tone="gold" index={0} />
                    <StatCard label="Disetujui" value={stats?.approved ?? 0} icon={Check} tone="teal" index={1} />
                    <StatCard label="Ditolak" value={stats?.rejected ?? 0} icon={X} tone="danger" index={2} />
                </div>

                <h2 className="mb-3 font-display text-lg font-bold" style={{ color: 'var(--color-ink)' }}>
                    Menunggu Tinjauan
                </h2>
                {rows.length === 0 ? (
                    <Card className="p-10 text-center">
                        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                            <ClipboardCheck className="h-6 w-6" />
                        </span>
                        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>Tidak ada produk yang menunggu kurasi.</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {rows.map((product) => (
                            <Card key={product.id} className="flex flex-wrap items-center justify-between gap-4 px-6 py-4">
                                <div className="min-w-0">
                                    <p className="truncate font-semibold" style={{ color: 'var(--color-ink)' }}>{product.name}</p>
                                    <p className="mt-0.5 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                                        {product.category?.name ?? '—'} · oleh {product.owner?.name ?? '—'}
                                    </p>
                                    <div className="mt-1.5">
                                        <StatusBadge label="Menunggu" tone="gold" />
                                    </div>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleApprove(product.id)}
                                        className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
                                        style={{ background: 'var(--color-accent)' }}
                                    >
                                        <Check className="h-4 w-4" /> Setujui
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openReject(product.id)}
                                        className="inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
                                        style={{ background: 'var(--color-danger)' }}
                                    >
                                        <X className="h-4 w-4" /> Tolak
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <ConfirmModal
                    open={rejectId !== null}
                    title="Tolak pengajuan ini?"
                    desc="Tulis alasan penolakan agar Admin P3M dapat memperbaiki pengajuannya."
                    confirmLabel="Tolak Pengajuan"
                    danger
                    processing={processing}
                    onConfirm={handleReject}
                    onClose={() => setRejectId(null)}
                >
                    <Field label="Alasan penolakan">
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="mis. Dokumen pendukung belum lengkap…"
                            className={inputClass}
                            {...inputStyleProps()}
                        />
                    </Field>
                </ConfirmModal>
            </FadeIn>
        </DashboardLayout>
    );
}

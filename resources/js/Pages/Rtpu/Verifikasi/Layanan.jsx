import { Head, router } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import ReviewPanel from '@/Components/ReviewPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };
const CHECKLIST = [
    'Identitas pemohon jelas (nama dan kontak)',
    'Jenis layanan dan kebutuhan terisi lengkap',
    'Jadwal / jumlah / peserta masuk akal',
    'Dokumen pendukung dilampirkan bila diperlukan',
];

export default function VerifikasiLayanan({ auth, antrean = [], selected = null }) {
    const rows = antrean;
    const [selId, setSelId] = useState(selected?.id ?? rows[0]?.id ?? null);
    const sel = rows.find((r) => r.id === selId) ?? rows[0] ?? null;
    const [processing, setProcessing] = useState(false);

    return (
        <DashboardLayout title="Verifikasi Pengajuan" breadcrumb="Admin RTPU / Verifikasi Pengajuan" activeKey="verify-layanan">
            <Head title="Verifikasi Pengajuan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Verifikasi Pengajuan Layanan"
                    desc="Periksa kelengkapan data, verifikasi isi pengajuan, lalu verifikasi atau tolak dengan catatan."
                />

                {rows.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="Antrean Pengajuan Kosong"
                        desc="Tidak ada pengajuan layanan baru yang menunggu verifikasi saat ini. Seluruh permohonan telah ditindaklanjuti."
                    />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] items-start">
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-slate-500">
                                Antrean Pengajuan ({rows.length})
                            </h2>
                            <div className="space-y-2.5">
                                {rows.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setSelId(p.id)}
                                        aria-pressed={sel?.id === p.id}
                                        className="block w-full rounded-2xl border p-4 text-left transition"
                                        style={
                                            sel?.id === p.id
                                                ? { borderColor: 'var(--color-accent)', background: 'var(--color-accent-tint)' }
                                                : { borderColor: 'var(--color-border)', background: 'var(--color-bg)' }
                                        }
                                    >
                                        <span className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{p.code}</span>
                                            <StatusBadge status={p.status} label={p.status} />
                                        </span>
                                        <span className="mt-1 block truncate text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                                            {p.layanan}
                                        </span>
                                        <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>
                                            {TYPE_LABEL[p.type]} · {p.customer} · {p.date}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-slate-500">
                                Detail Pengajuan & Verifikasi
                            </h2>
                            {!sel ? (
                                <Card className="flex flex-col items-center justify-center p-12 text-center text-sm text-slate-500">
                                    Pilih pengajuan dari antrean untuk meninjau.
                                </Card>
                            ) : (
                            <Card className="p-6">
                                <div className="mb-1 flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{sel.code}</span>
                                    <StatusBadge status={sel.status} label={sel.status} />
                                </div>
                                <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>{sel.layanan}</h2>
                                <dl className="mt-4 divide-y rounded-2xl border px-4" style={{ borderColor: 'var(--color-border)' }}>
                                    {[
                                        ['Pemohon', sel.customer],
                                        ['Tipe', TYPE_LABEL[sel.type]],
                                        ['Jumlah', sel.qty ?? '-'],
                                        ['Keperluan', sel.need ?? '-'],
                                        ['Tanggal', sel.date],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                                            <dt style={{ color: 'var(--color-muted)' }}>{k}</dt>
                                            <dd className="text-right font-medium" style={{ color: 'var(--color-ink)' }}>{v}</dd>
                                        </div>
                                    ))}
                                </dl>
                                <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
                                    <ReviewPanel
                                        title="Panel peninjau"
                                        checklist={CHECKLIST}
                                        approveLabel="Verifikasi"
                                        onApprove={() => {
                                            setProcessing(true);
                                            router.patch(route('rtpu.verify.layanan.approve', sel.id), {}, {
                                                onFinish: () => setProcessing(false),
                                            });
                                            return null;
                                        }}
                                        onReject={(catatan) => {
                                            setProcessing(true);
                                            router.patch(route('rtpu.verify.layanan.reject', sel.id), { catatan }, {
                                                onFinish: () => setProcessing(false),
                                            });
                                            return null;
                                        }}
                                    />
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            )}
            </FadeIn>
        </DashboardLayout>
    );
}

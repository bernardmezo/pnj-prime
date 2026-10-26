import { Head, router } from '@inertiajs/react';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import ReviewPanel from '@/Components/ReviewPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';

const CHECKLIST = [
    'Nominal transfer sesuai tagihan',
    'Nama pengirim / nomor rekening terbaca',
    'Tanggal transfer masuk akal',
    'Kode pengajuan tercantum pada berita transfer',
];

export default function VerifikasiPembayaran({ auth, antrean = [], selected = null }) {
    const rows = antrean;
    const [selId, setSelId] = useState(selected?.id ?? rows[0]?.id ?? null);
    const sel = rows.find((r) => r.id === selId) ?? rows[0] ?? null;

    return (
        <DashboardLayout title="Verifikasi Pembayaran" breadcrumb="Admin RTPU / Verifikasi Pembayaran" activeKey="verify-bayar">
            <Head title="Verifikasi Pembayaran · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Verifikasi Pembayaran"
                    desc="Periksa bukti transfer terhadap tagihan, lalu terima atau tolak dengan catatan."
                />

                {rows.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="Tidak Ada Pembayaran Menunggu Verifikasi"
                        desc="Seluruh bukti transfer telah selesai diperiksa dan dikonfirmasi."
                    />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] items-start">
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-slate-500">
                                Menunggu Verifikasi ({rows.length})
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
                                        <span className="mt-1 block text-sm font-bold" style={{ color: 'var(--color-ink)' }}>
                                            Rp {Number(p.amount ?? 0).toLocaleString('id-ID')}
                                        </span>
                                        <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>
                                            {p.customer} · {p.method} · {p.at}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-slate-500">
                                Detail Tagihan & Bukti Transfer
                            </h2>
                            {!sel ? (
                                <Card className="flex flex-col items-center justify-center p-12 text-center text-sm text-slate-500">
                                    Pilih salah satu transaksi dari antrean untuk meninjau.
                                </Card>
                            ) : (
                                <Card className="p-6">
                                    <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
                                        Rp {Number(sel.amount ?? 0).toLocaleString('id-ID')}
                                    </h2>
                                    <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                                        {sel.code} · {sel.customer} · {sel.method} · {sel.at}
                                    </p>
                                    <div className="mt-4 rounded-2xl border-2 border-dashed p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
                                        <p className="text-sm font-medium" style={{ color: 'var(--color-ink)' }}>Pratinjau bukti pembayaran</p>
                                        <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                                            {sel.proof ? (
                                                <a href={sel.proof} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2" style={{ color: 'var(--color-accent-hover)' }}>
                                                    Buka bukti pembayaran
                                                </a>
                                            ) : 'Belum ada berkas.'}
                                        </p>
                                    </div>
                                    <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
                                        <ReviewPanel
                                            title="Panel peninjau"
                                            checklist={CHECKLIST}
                                            approveLabel="Terima"
                                            onApprove={() => {
                                                router.patch(route('rtpu.verify.bayar.accept', sel.id));
                                                return null;
                                            }}
                                            onReject={(catatan) => {
                                                router.patch(route('rtpu.verify.bayar.reject', sel.id), { catatan });
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

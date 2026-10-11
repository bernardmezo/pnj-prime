import { Head } from '@inertiajs/react';
import { useState } from 'react';
import ReviewPanel from '@/Components/ReviewPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';
import { mockPembayaran } from '@/mocks/data';

const CHECKLIST = [
    'Nominal transfer sesuai tagihan',
    'Nama pengirim / nomor rekening terbaca',
    'Tanggal transfer masuk akal',
    'Kode pengajuan tercantum pada berita transfer',
];

// TODO(backend): no payment verification routes yet. Terima/Tolak show a
// neutral notice; nothing is sent and no success is faked.
export default function VerifikasiPembayaran({ auth, antrean, selected }) {
    const rows = antrean ?? mockPembayaran;
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
                <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
                    <div>
                        <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
                            Menunggu verifikasi ({rows.length})
                        </h2>
                        <div className="space-y-2">
                            {rows.length === 0 && (
                                <Card className="p-6 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                                    Tidak ada pembayaran menunggu verifikasi.
                                </Card>
                            )}
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
                        {!sel ? (
                            <Card className="p-10 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                                Pilih pembayaran dari antrean untuk meninjau.
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
                                        {sel.proof ? sel.proof : 'Belum ada berkas pratinjau pada data contoh.'}
                                    </p>
                                </div>
                                <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
                                    <ReviewPanel
                                        title="Panel peninjau"
                                        checklist={CHECKLIST}
                                        approveLabel="Terima"
                                        onApprove={() => 'Penerimaan pembayaran belum tersedia. Backend perlu menyediakan endpoint verifikasi pembayaran.'}
                                        onReject={() => 'Penolakan pembayaran belum tersedia. Backend perlu menyediakan endpoint penolakan pembayaran.'}
                                    />
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </FadeIn>
        </DashboardLayout>
    );
}

import { Head } from '@inertiajs/react';
import { useState } from 'react';
import ReviewPanel from '@/Components/ReviewPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';
import { mockPengajuan } from '@/mocks/data';

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };
const CHECKLIST = [
    'Identitas pemohon jelas (nama dan kontak)',
    'Jenis layanan dan kebutuhan terisi lengkap',
    'Jadwal / jumlah / peserta masuk akal',
    'Dokumen pendukung dilampirkan bila diperlukan',
];

// TODO(backend): no verifikasi routes yet. Verifikasi/Tolak show a neutral
// notice; nothing is sent and no success is faked.
export default function VerifikasiLayanan({ auth, antrean, selected }) {
    const rows = antrean ?? mockPengajuan.filter((p) => p.status === 'Diajukan');
    const [selId, setSelId] = useState(selected?.id ?? rows[0]?.id ?? null);
    const sel = rows.find((r) => r.id === selId) ?? rows[0] ?? null;
    const [notice, setNotice] = useState(null);

    return (
        <DashboardLayout title="Verifikasi Pengajuan" breadcrumb="Admin RTPU / Verifikasi Pengajuan" activeKey="verify-layanan">
            <Head title="Verifikasi Pengajuan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Verifikasi Pengajuan Layanan"
                    desc="Periksa kelengkapan data, verifikasi isi pengajuan, lalu verifikasi atau tolak dengan catatan."
                />
                <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
                    <div>
                        <h2 className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-muted)' }}>
                            Antrean ({rows.length})
                        </h2>
                        <div className="space-y-2">
                            {rows.length === 0 && (
                                <Card className="p-6 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
                                    Antrean kosong.
                                </Card>
                            )}
                            {rows.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => { setSelId(p.id); setNotice(null); }}
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
                        {!sel ? (
                            <Card className="p-10 text-center text-sm" style={{ color: 'var(--color-muted)' }}>
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
                                        onApprove={() => 'Keputusan verifikasi belum tersedia. Backend perlu menyediakan endpoint verifikasi pengajuan.'}
                                        onReject={() => 'Penolakan belum tersedia. Backend perlu menyediakan endpoint penolakan pengajuan.'}
                                    />
                                    {notice && (
                                        <p className="mt-3 rounded-xl px-4 py-2.5 text-[13px]" role="status" style={{ background: 'var(--color-surface)', color: 'var(--color-muted)' }}>
                                            {notice}
                                        </p>
                                    )}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </FadeIn>
        </DashboardLayout>
    );
}

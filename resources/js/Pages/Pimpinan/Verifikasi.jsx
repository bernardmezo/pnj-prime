import { Head } from '@inertiajs/react';
import { useState } from 'react';
import ReviewPanel from '@/Components/ReviewPanel';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';
import { mockProdukUnggulan } from '@/mocks/data';

const CHECKLIST = [
    'Proposal produk unggulan dilampirkan',
    'Data peneliti / tim jelas',
    'Dokumen pendukung (foto, hasil uji) lengkap',
    'Usulan harga dan kategori terisi',
];

// TODO(backend): no pimpinan verification route yet. Setujui/Tolak show a
// neutral notice; nothing is sent and no success is faked.
export default function PimpinanVerifikasi({ auth, antrean, selected }) {
    const rows = antrean ?? mockProdukUnggulan.filter((p) => p.status === 'Diajukan');
    const [selId, setSelId] = useState(selected?.id ?? rows[0]?.id ?? null);
    const sel = rows.find((r) => r.id === selId) ?? rows[0] ?? null;

    return (
        <DashboardLayout title="Verifikasi Produk Unggulan" breadcrumb="Pimpinan RTPU / Verifikasi" activeKey="verify">
            <Head title="Verifikasi Produk Unggulan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Pimpinan RTPU"
                    title="Verifikasi Produk Unggulan"
                    desc="Periksa kelengkapan dan dokumen pendukung, lalu setujui atau tolak dengan catatan."
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
                                        {p.name}
                                    </span>
                                    <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>
                                        {p.researcher} · {p.category} · {p.date}
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
                                <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>{sel.name}</h2>
                                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{sel.desc}</p>
                                <dl className="mt-4 divide-y rounded-2xl border px-4" style={{ borderColor: 'var(--color-border)' }}>
                                    {[
                                        ['Peneliti', sel.researcher],
                                        ['Tim', sel.team],
                                        ['Kategori', sel.category],
                                        ['Usulan harga', sel.price ? `Rp ${Number(sel.price).toLocaleString('id-ID')}` : '-'],
                                    ].map(([k, v]) => (
                                        <div key={k} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                                            <dt style={{ color: 'var(--color-muted)' }}>{k}</dt>
                                            <dd className="text-right font-medium" style={{ color: 'var(--color-ink)' }}>{v}</dd>
                                        </div>
                                    ))}
                                </dl>
                                {(sel.documents ?? []).length > 0 && (
                                    <div className="mt-4">
                                        <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Dokumen pendukung</p>
                                        <ul className="space-y-1.5">
                                            {sel.documents.map((d, i) => (
                                                <li key={i} className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--color-surface)' }}>
                                                    <span style={{ color: 'var(--color-ink)' }}>{d.name}</span>
                                                    <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{d.size}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="mt-5 border-t pt-5" style={{ borderColor: 'var(--color-border)' }}>
                                    <ReviewPanel
                                        title="Panel peninjau"
                                        checklist={CHECKLIST}
                                        approveLabel="Setujui"
                                        onApprove={() => 'Persetujuan belum tersedia. Backend perlu menyediakan endpoint verifikasi produk unggulan.'}
                                        onReject={() => 'Penolakan belum tersedia. Backend perlu menyediakan endpoint penolakan produk unggulan.'}
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

import { Head, router } from '@inertiajs/react';
import { CheckCircle2, Eye, FileText, User, Building2, Mail, Phone } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';
import ReviewPanel from '@/Components/ReviewPanel';

const CHECKLIST = [
    'Proposal produk unggulan dilampirkan',
    'Data peneliti / tim jelas',
    'Dokumen pendukung (foto, hasil uji) lengkap',
    'Usulan harga dan kategori terisi',
];

export default function VerifikasiProduk({ auth, products }) {
    const rows = products?.data || (Array.isArray(products) ? products : []);
    const [selId, setSelId] = useState(rows[0]?.id ?? null);
    const sel = rows.find((r) => r.id === selId) ?? rows[0] ?? null;
    const [processing, setProcessing] = useState(false);

    const formatPrice = (price) => {
        return price ? `Rp ${Number(price).toLocaleString('id-ID')}` : '-';
    };

    const handleVerify = () => {
        if (processing || !sel) return;
        setProcessing(true);
        router.patch(route('rtpu.verify.produk.verify', sel.id), {}, {
            onFinish: () => setProcessing(false),
        });
    };

    const handleReject = (catatan) => {
        if (processing || !sel) return;
        setProcessing(true);
        router.patch(route('rtpu.verify.produk.reject', sel.id), { catatan }, {
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DashboardLayout title="Verifikasi Pengajuan" breadcrumb="Admin RTPU / Verifikasi Pengajuan" activeKey="verify-produk">
            <Head title="Verifikasi Pengajuan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin RTPU"
                    title="Verifikasi Produk Unggulan"
                    desc="Telaah proposal produk unggulan dari P3M. Produk katalog menunggu verifikasi di menu Verifikasi Pesanan & Katalog."
                />

                {rows.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="Antrean Pengajuan Kosong"
                        desc="Tidak ada proposal produk unggulan yang menunggu telaah saat ini."
                    />
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr] items-start">
                        {/* Left: Queue list */}
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
                                Antrean Berkas ({rows.length})
                            </h2>
                            <div className="space-y-2.5">
                                {rows.map((p) => (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => setSelId(p.id)}
                                        aria-pressed={sel?.id === p.id}
                                        className="block w-full rounded-2xl border p-4 text-left shadow-[var(--shadow-card)] transition hover:border-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
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
                                            {p.researcher} · {p.category} · {p.created_at}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right: Detail & Review Panel */}
                        <div>
                            <h2 className="mb-3 text-sm font-semibold text-[var(--color-muted)]">
                                Lembar Peninjauan & Keputusan
                            </h2>
                            {!sel ? (
                                <Card className="flex flex-col items-center justify-center p-12 text-center text-sm text-[var(--color-muted)]">
                                    Pilih salah satu berkas dari antrean untuk meninjau.
                                </Card>
                            ) : (
                                <Card className="p-6">
                                    <div className="mb-1 flex flex-wrap items-center gap-2">
                                        <span className="font-mono text-xs" style={{ color: 'var(--color-muted)' }}>{sel.code}</span>
                                        <StatusBadge status={sel.status} label={sel.status} />
                                    </div>
                                    <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>{sel.name}</h2>
                                    <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>{sel.description}</p>
                                    
                                    <dl className="mt-4 divide-y rounded-2xl border px-4" style={{ borderColor: 'var(--color-border)' }}>
                                        {[
                                            ['Peneliti', sel.researcher],
                                            ['Tim', sel.team],
                                            ['Kategori', sel.category],
                                            ['Unit / Institusi', sel.unit],
                                            ['Usulan harga', formatPrice(sel.price)],
                                        ].map(([k, v]) => (
                                            <div key={k} className="flex items-start justify-between gap-4 py-2.5 text-sm">
                                                <dt style={{ color: 'var(--color-muted)' }}>{k}</dt>
                                                <dd className="text-right font-medium" style={{ color: 'var(--color-ink)' }}>{v}</dd>
                                            </div>
                                        ))}
                                    </dl>

                                    {/* Owner Detail */}
                                    {(sel.owner || sel.phone || sel.nip || sel.jurusan) && (
                                        <div className="mt-5 rounded-2xl border border-[var(--color-border)] p-4">
                                            <h3 className="text-sm font-semibold text-[var(--color-ink)] mb-3 flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                <span>Pengusul Produk</span>
                                            </h3>
                                            <dl className="space-y-3">
                                                {sel.owner && (
                                                    <div className="flex items-start gap-3">
                                                        <User className="h-4 w-4 text-[var(--color-muted)] mt-0.5" />
                                                        <div>
                                                            <dt className="text-xs text-[var(--color-muted)]">Nama</dt>
                                                            <dd className="text-sm font-medium text-[var(--color-ink)]">{sel.owner}</dd>
                                                        </div>
                                                    </div>
                                                )}
                                                {sel.phone && (
                                                    <div className="flex items-start gap-3">
                                                        <Phone className="h-4 w-4 text-[var(--color-muted)] mt-0.5" />
                                                        <div>
                                                            <dt className="text-xs text-[var(--color-muted)]">Telepon</dt>
                                                            <dd className="text-sm font-medium text-[var(--color-ink)]">{sel.phone}</dd>
                                                        </div>
                                                    </div>
                                                )}
                                                {sel.nip && (
                                                    <div className="flex items-start gap-3">
                                                        <Building2 className="h-4 w-4 text-[var(--color-muted)] mt-0.5" />
                                                        <div>
                                                            <dt className="text-xs text-[var(--color-muted)]">NIP</dt>
                                                            <dd className="text-sm font-medium text-[var(--color-ink)]">{sel.nip}</dd>
                                                        </div>
                                                    </div>
                                                )}
                                                {sel.jurusan && (
                                                    <div className="flex items-start gap-3">
                                                        <Building2 className="h-4 w-4 text-[var(--color-muted)] mt-0.5" />
                                                        <div>
                                                            <dt className="text-xs text-[var(--color-muted)]">Jurusan</dt>
                                                            <dd className="text-sm font-medium text-[var(--color-ink)]">{sel.jurusan}</dd>
                                                        </div>
                                                    </div>
                                                )}
                                            </dl>
                                        </div>
                                    )}

                                    {/* Documents */}
                                    {(sel.documents ?? []).length > 0 && (
                                        <div className="mt-5">
                                            <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Dokumen pendukung</p>
                                            <ul className="space-y-1.5">
                                                {sel.documents.map((d, i) => (
                                                    <li key={i} className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm" style={{ background: 'var(--color-surface)' }}>
                                                        <a href={d.url || '#'} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-2" style={{ color: 'var(--color-accent-hover)' }}>
                                                            {d.name || `Dokumen ${i + 1}`}
                                                        </a>
                                                        {d.size && (
                                                            <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{d.size}</span>
                                                        )}
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
                                            onApprove={handleVerify}
                                            onReject={handleReject}
                                            processing={processing}
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

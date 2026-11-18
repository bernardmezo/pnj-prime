import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Eye } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';

export default function VerifikasiProduk({ auth, products }) {
    const rows = products?.data || (Array.isArray(products) ? products : []);

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
                    <div className="space-y-3">
                        <h2 className="text-sm font-semibold text-[var(--color-muted)]">
                            Antrean Produk Riset ({rows.length})
                        </h2>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {rows.map((p) => (
                                <Card key={p.id} className="p-5">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-sm text-[var(--color-ink)] mb-1">
                                                {p.name}
                                            </h3>
                                            <p className="text-xs text-[var(--color-muted)] line-clamp-2">
                                                {p.category} · {p.unit}
                                            </p>
                                        </div>
                                        <StatusBadge status={p.curation_status} />
                                    </div>
                                    
                                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)]">
                                        <div className="text-xs text-[var(--color-muted)]">
                                            <span className={p.target_audience === 'internal_pnj' ? 'text-amber-700 font-semibold' : 'text-[var(--color-accent)] font-semibold'}>
                                                {p.target_audience === 'internal_pnj' ? '🔒 Internal PNJ' : '🌐 Publik'}
                                            </span>
                                            {' · '}
                                            <span className="font-medium text-[var(--color-ink)]">
                                                {p.final_price ? `Rp ${Number(p.final_price).toLocaleString('id-ID')}` : 'Belum ada harga'}
                                            </span>
                                        </div>
                                        <Link
                                            href={route('rtpu.verify.produk.show', p.id)}
                                            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
                                            style={{ background: 'var(--color-accent)' }}
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            <span>Verifikasi</span>
                                        </Link>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}

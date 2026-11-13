import { Head, router } from '@inertiajs/react';
import { Package } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';
import Modal from '@/Components/ui/Modal';

export default function PesananProduk({ pesanan = [] }) {
    const [selectedId, setSelectedId] = useState(null);
    const [filter, setFilter] = useState('Semua');
    const [processing, setProcessing] = useState(false);
    const selected = pesanan.find((p) => p.id === selectedId);
    const rows = filter === 'Semua' ? pesanan : pesanan.filter((p) => p.status === filter);
    const money = (value) => `Rp ${Number(value ?? 0).toLocaleString('id-ID')}`;
    const update = (status) => {
        if (!confirm(status === 'Selesai' ? 'Pastikan barang sudah diterima customer. Selesaikan pesanan?' : 'Mulai menyiapkan pesanan ini?')) return;
        setProcessing(true);
        router.patch(route('pengelola.pesanan.update', selected.id), { status }, {
            preserveScroll: true,
            onSuccess: () => setSelectedId(null),
            onFinish: () => setProcessing(false),
        });
    };

    return (
        <DashboardLayout title="Pesanan Produk" activeKey="pesanan">
            <Head title="Pesanan Produk · PNJ Prime" />
            <FadeIn>
                <PageHeader eyebrow="Admin Pengelola" title="Pesanan Produk" desc="Pantau produk yang telah dibayar dan siapkan pesanan sesuai pilihan customer." />
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    {[['Lunas', 'Perlu disiapkan'], ['Diproses', 'Sedang diproses'], ['Selesai', 'Pesanan selesai']].map(([status, label]) => (
                        <Card key={status} className="p-5">
                            <p className="text-sm text-[var(--color-muted)]">{label}</p>
                            <p className="mt-2 font-display text-3xl font-bold text-[var(--color-accent)]">{pesanan.filter((p) => p.status === status).length}</p>
                        </Card>
                    ))}
                </div>
                <div className="my-5 flex flex-wrap gap-2" aria-label="Filter pesanan">
                    {['Semua', 'Lunas', 'Diproses', 'Selesai'].map((status) => (
                        <button key={status} type="button" onClick={() => setFilter(status)} aria-pressed={filter === status}
                            className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${filter === status ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-muted)]'}`}>
                            {status === 'Lunas' ? 'Perlu disiapkan' : status}
                        </button>
                    ))}
                </div>
                {rows.length === 0 ? <EmptyState icon={Package} title="Belum ada pesanan" desc="Pesanan produk milik Anda yang sudah dibayar akan muncul di sini." /> : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {rows.map((p) => (
                            <Card key={p.id} className="p-5">
                                <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs text-[var(--color-muted)]">{p.code}</span><StatusBadge status={p.status} /></div>
                                <h2 className="mt-3 font-display font-bold text-[var(--color-ink)]">{p.product}</h2>
                                <p className="mt-2 text-sm text-[var(--color-muted)]">{p.customer?.name} · {p.quantity ?? 'Belum diisi'} unit</p>
                                <p className="mt-2 text-sm font-semibold text-[var(--color-accent)]">{p.fulfillment || 'Metode pengambilan belum diisi'}</p>
                                <p className="mt-3 font-semibold">{money(p.total)}</p>
                                <button type="button" onClick={() => setSelectedId(p.id)} className="mt-4 rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">Lihat Detail Pesanan</button>
                            </Card>
                        ))}
                    </div>
                )}
            </FadeIn>
            <Modal open={Boolean(selected)} onClose={() => setSelectedId(null)} title="Detail Pesanan Produk" size="2xl">
                {selected && <div className="space-y-5">
                    {selected.thumbnail && <img src={`/storage/${selected.thumbnail}`} alt={selected.product} className="h-56 w-full rounded-2xl bg-[var(--color-surface)] object-contain" />}
                    <h2 className="font-display text-xl font-bold">{selected.product}</h2>
                    <StatusBadge status={selected.status} />
                    <dl className="divide-y divide-[var(--color-border)]">
                        {[
                            ['Kode', selected.code], ['Tanggal pengajuan', selected.date], ['Jumlah', selected.quantity], ['Total dibayar', money(selected.total)],
                            ['Customer', selected.customer?.name], ['Email', selected.customer?.email], ['Telepon', selected.customer?.phone],
                            ['Pengiriman / pengambilan', selected.fulfillment], ['Catatan customer / pengiriman', selected.notes],
                        ].map(([label, value]) => <div key={label} className="grid gap-1 py-3 text-sm sm:grid-cols-2"><dt className="text-[var(--color-muted)]">{label}</dt><dd className="min-w-0 whitespace-pre-wrap break-words font-medium">{value ?? 'Belum diisi'}</dd></div>)}
                    </dl>
                    <p className="rounded-xl bg-[var(--color-accent-tint)] p-4 text-sm text-[var(--color-accent)]">Siapkan sesuai pilihan customer. Selesaikan pesanan hanya setelah barang diterima customer.</p>
                    {selected.status !== 'Selesai' && <button type="button" disabled={processing} onClick={() => update(selected.status === 'Lunas' ? 'Diproses' : 'Selesai')} className="rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">{processing ? 'Menyimpan…' : selected.status === 'Lunas' ? 'Mulai Proses' : 'Selesaikan Pesanan'}</button>}
                </div>}
            </Modal>
        </DashboardLayout>
    );
}

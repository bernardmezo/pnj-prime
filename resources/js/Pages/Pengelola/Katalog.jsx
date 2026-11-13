import { Head, Link } from '@inertiajs/react';
import { Package } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, StatusBadge } from '@/Components/ui';

export default function KatalogPengelola({ products = [] }) {
    return (
        <DashboardLayout title="Katalog Produk Saya" activeKey="catalog">
            <Head title="Katalog Produk Saya · PNJ Prime" />
            <FadeIn>
                <div className="mb-6 border-b border-[var(--color-border)] pb-5"><h1 className="font-display text-2xl font-bold sm:text-3xl">Katalog Produk Saya</h1><p className="mt-2 text-sm text-[var(--color-muted)]">Produk yang Anda ajukan, jumlah unit terjual, dan sisa stok berdasarkan pesanan yang sudah dibayar.</p></div>
                {products.length === 0 ? <EmptyState icon={Package} title="Belum ada produk" desc="Produk yang Anda ajukan akan tampil di sini." /> : (
                    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {products.map((product) => {
                            const sold = Number(product.sold_count ?? 0);
                            const preorder = product.meta?.availability_status === 'preorder';
                            const remaining = product.stock == null ? null : Math.max(0, Number(product.stock) - sold);
                            return (
                                <Card key={product.id} className="overflow-hidden">
                                    {product.thumbnail ? <img src={`/storage/${product.thumbnail}`} alt={product.name} className="aspect-[4/3] w-full bg-[var(--color-surface)] object-cover" /> : <div className="flex h-48 items-center justify-center bg-[var(--color-surface)] text-[var(--color-muted)]"><Package className="h-10 w-10" /></div>}
                                    <div className="p-4">
                                        <StatusBadge status={product.curation_status} />
                                        <h2 className="mt-3 font-display text-lg font-bold">{product.name}</h2>
                                        <p className="mt-1 text-xs text-[var(--color-muted)]">{product.category?.name || 'Kategori belum diisi'}</p>
                                        <p className="mt-3 font-semibold text-[var(--color-accent)]">Rp {Number(product.base_price ?? 0).toLocaleString('id-ID')}</p>
                                        <div className="my-4 grid grid-cols-2 gap-3 rounded-2xl bg-[var(--color-surface)] p-4">
                                            <div><p className="text-xs text-[var(--color-muted)]">Terjual</p><p className="mt-1 text-lg font-bold">{sold} unit</p></div>
                                            <div><p className="text-xs text-[var(--color-muted)]">Sisa stok</p><p className="mt-1 text-lg font-bold text-[var(--color-accent)]">{preorder ? 'Pre-order' : remaining == null ? 'Belum diisi' : `${remaining} unit`}</p></div>
                                        </div>
                                        <Link href={route('catalog.show', product.slug)} className="inline-flex rounded-full bg-[var(--color-accent-tint)] px-5 py-2.5 text-sm font-semibold text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2">Lihat Detail</Link>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}

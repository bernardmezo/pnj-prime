import { Head, Link } from '@inertiajs/react';
import { Package, Pencil, Plus } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { Card, EmptyState, FadeIn, PageHeader, PrimaryButton, StatusBadge, Table, Td, isInternalRole } from '@/Components/ui';

const CURATION_LABEL = { draft: 'Draft', pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' };

// TODO(backend): superseded by Rtpu/Layanan + P3M pages; remove products.* routes when backend migrates
export default function ProductIndex({ auth, products }) {
    const canCreate = isInternalRole(auth.user.role);
    const rows = products?.data ?? [];

    return (
        <DashboardLayout title="Pengajuan Inovasi" breadcrumb="PNJ Prime / Produk">
            <Head title="Produk · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin P3M"
                    title="Daftar Produk"
                    desc="Kelola produk dan inovasi yang diajukan untuk komersialisasi melalui kurasi Admin RTPU."
                    actions={canCreate ? (
                        <PrimaryButton href={route('products.create')}>
                            <Plus className="h-4 w-4" /> Tambah Produk
                        </PrimaryButton>
                    ) : null}
                />
                {rows.length === 0 ? (
                    <EmptyState
                        icon={Package}
                        title="Belum ada produk"
                        desc={canCreate ? 'Mulai tambahkan produk inovasi Anda untuk diajukan ke kurasi.' : 'Tidak ada produk yang dapat ditampilkan.'}
                        action={canCreate ? (
                            <PrimaryButton href={route('products.create')}>
                                <Plus className="h-4 w-4" /> Tambah Produk
                            </PrimaryButton>
                        ) : null}
                    />
                ) : (
                    <Table columns={['Nama Produk', 'Kategori', 'Harga', 'Status Kurasi', '']}>
                        <tbody>
                            {rows.map((product) => (
                                <tr key={product.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td strong>{product.name}</Td>
                                    <Td><span style={{ color: 'var(--color-muted)' }}>{product.category?.name ?? '-'}</span></Td>
                                    <Td>Rp {Number(product.final_price ?? 0).toLocaleString('id-ID')}</Td>
                                    <Td>
                                        <StatusBadge status={product.curation_status} label={CURATION_LABEL[product.curation_status] ?? product.curation_status} />
                                    </Td>
                                    <Td>
                                        <Link
                                            href={route('products.edit', product.id)}
                                            className="inline-flex items-center gap-1 text-sm font-medium"
                                            style={{ color: 'var(--color-accent-hover)' }}
                                        >
                                            <Pencil className="h-3.5 w-3.5" /> Edit
                                        </Link>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </FadeIn>
        </DashboardLayout>
    );
}

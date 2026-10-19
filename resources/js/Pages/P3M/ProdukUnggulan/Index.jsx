import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import PengajuanProdukModal from '@/Components/PengajuanProdukModal';
import { EmptyState, FadeIn, PageHeader, PrimaryButton, StatusBadge, Table, Td } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';
import { canBatalProduk, canUbahProduk } from '@/lib/statuses';

export default function ProdukIndex({ auth, daftar = [] }) {
    const role = auth?.user?.role;
    const rows = daftar;
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <DashboardLayout title="Pemantauan Produk Unggulan" breadcrumb="Admin P3M / Pemantauan" activeKey="pantau">
            <Head title="Pemantauan Produk Unggulan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin P3M"
                    title="Pemantauan Produk Unggulan"
                    desc="Pengajuan produk unggulan Anda yang masih berjalan."
                    actions={
                        <PrimaryButton onClick={() => setModalOpen(true)}>
                            <FilePlus2 className="h-4 w-4" />
                            Ajukan Produk Unggulan
                        </PrimaryButton>
                    }
                />
                {rows.length === 0 ? (
                    <EmptyState
                        title="Tidak ada pengajuan berjalan"
                        desc="Ajukan produk unggulan pertama Anda."
                        action={
                            <PrimaryButton onClick={() => setModalOpen(true)}>
                                <FilePlus2 className="h-4 w-4" />
                                Ajukan Produk Unggulan
                            </PrimaryButton>
                        }
                    />
                ) : (
                    <Table columns={['Kode', 'Nama Produk', 'Kategori', 'Tanggal', 'Status', '']}>
                        <tbody>
                            {rows.map((p) => (
                                <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td className="font-mono" strong>{p.code}</Td>
                                    <Td strong>{p.name}</Td>
                                    <Td>{p.category}</Td>
                                    <Td><span style={{ color: 'var(--color-muted)' }}>{p.date}</span></Td>
                                    <Td><StatusBadge status={p.status} label={p.status} /></Td>
                                    <Td>
                                        <span className="flex gap-3">
                                            <a href={navHref('p3m.produk.show', { id: p.id }, role)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                                Detail
                                            </a>
                                            {canUbahProduk(p.status) && (
                                                <a href={navHref('p3m.produk.edit', { id: p.id }, role)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                                    Ubah
                                                </a>
                                            )}
                                            {canBatalProduk(p.status) && (
                                                <a href={navHref('p3m.produk.show', { id: p.id }, role)} className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
                                                    Batalkan
                                                </a>
                                            )}
                                        </span>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
                <PengajuanProdukModal open={modalOpen} onClose={() => setModalOpen(false)} />
            </FadeIn>
        </DashboardLayout>
    );
}

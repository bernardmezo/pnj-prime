import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { EmptyState, FadeIn, PageHeader, PrimaryButton, StatusBadge, Table, Td } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';
import { canBatalProduk, canUbahProduk } from '@/lib/statuses';
import { mockProdukUnggulan } from '@/mocks/data';

export default function ProdukIndex({ auth, daftar }) {
    const role = auth?.user?.role;
    const rows = daftar ?? mockProdukUnggulan.filter((p) => !['Disetujui', 'Ditolak', 'Dibatalkan'].includes(p.status));

    return (
        <DashboardLayout title="Pemantauan Produk Unggulan" breadcrumb="Admin P3M / Pemantauan" activeKey="pantau">
            <Head title="Pemantauan Produk Unggulan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin P3M"
                    title="Pemantauan Produk Unggulan"
                    desc="Pengajuan produk unggulan Anda yang masih berjalan."
                    actions={
                        <PrimaryButton href={navHref('p3m.produk.create', {}, role)}>
                            + Ajukan Produk Unggulan
                        </PrimaryButton>
                    }
                />
                {rows.length === 0 ? (
                    <EmptyState
                        title="Tidak ada pengajuan berjalan"
                        desc="Ajukan produk unggulan pertama Anda."
                        action={
                            <PrimaryButton href={navHref('p3m.produk.create', {}, role)}>
                                + Ajukan Produk Unggulan
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
            </FadeIn>
        </DashboardLayout>
    );
}

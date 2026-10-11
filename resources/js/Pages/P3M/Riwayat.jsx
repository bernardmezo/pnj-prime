import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, PageHeader, StatusBadge, Table, Td } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';
import { mockProdukUnggulan } from '@/mocks/data';

export default function P3mRiwayat({ auth, riwayat }) {
    const role = auth?.user?.role;
    const rows = riwayat ?? mockProdukUnggulan;

    return (
        <DashboardLayout title="Riwayat Produk Unggulan" breadcrumb="Admin P3M / Riwayat" activeKey="riwayat">
            <Head title="Riwayat Produk Unggulan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Admin P3M"
                    title="Riwayat Produk Unggulan"
                    desc="Seluruh pengajuan produk unggulan: berjalan, disetujui, ditolak, dan dibatalkan."
                />
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
                                    <a href={navHref('p3m.produk.show', { id: p.id }, role)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                        Detail
                                    </a>
                                </Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </FadeIn>
        </DashboardLayout>
    );
}

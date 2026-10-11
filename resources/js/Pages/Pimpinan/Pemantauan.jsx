import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, PageHeader, StatusBadge, Table, Td } from '@/Components/ui';
import { mockProdukUnggulan } from '@/mocks/data';

// Read-only: no action buttons on this page.
export default function PimpinanPemantauan({ auth, produk }) {
    const rows = produk ?? mockProdukUnggulan;

    return (
        <DashboardLayout title="Pemantauan" breadcrumb="Pimpinan RTPU / Pemantauan" activeKey="pantau">
            <Head title="Pemantauan Produk Unggulan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Pimpinan RTPU"
                    title="Pemantauan Produk Unggulan"
                    desc="Seluruh pengajuan produk unggulan dalam semua status. Halaman ini hanya untuk pemantauan."
                />
                <Table columns={['Kode', 'Nama Produk', 'Peneliti', 'Tanggal', 'Status']}>
                    <tbody>
                        {rows.map((p) => (
                            <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                <Td className="font-mono" strong>{p.code}</Td>
                                <Td strong>{p.name}</Td>
                                <Td>{p.researcher}</Td>
                                <Td><span style={{ color: 'var(--color-muted)' }}>{p.date}</span></Td>
                                <Td><StatusBadge status={p.status} label={p.status} /></Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </FadeIn>
        </DashboardLayout>
    );
}

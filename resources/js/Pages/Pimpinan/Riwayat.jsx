import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, PageHeader, StatusBadge, Table, Td } from '@/Components/ui';

export default function PimpinanRiwayat({ auth, produk = [] }) {
    const rows = produk;

    return (
        <DashboardLayout title="Riwayat Produk Unggulan" breadcrumb="Pimpinan RTPU / Riwayat" activeKey="riwayat">
            <Head title="Riwayat Produk Unggulan · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Pimpinan RTPU"
                    title="Riwayat Produk Unggulan"
                    desc="Arsip seluruh pengajuan produk unggulan yang pernah masuk."
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

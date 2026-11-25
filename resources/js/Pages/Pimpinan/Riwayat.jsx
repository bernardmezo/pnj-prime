import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, PageHeader, StatusBadge, Table, Td } from '@/Components/ui';

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', alat: 'Alat', produk: 'Produk' };

export default function PimpinanRiwayat({ auth, riwayat = [] }) {
    const rows = riwayat;

    return (
        <DashboardLayout title="Riwayat Transaksi" breadcrumb="Pimpinan RTPU / Riwayat" activeKey="riwayat">
            <Head title="Riwayat Transaksi · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Pimpinan RTPU"
                    title="Riwayat Transaksi Layanan"
                    desc="Seluruh transaksi layanan dari semua Customer."
                />
                <Table columns={['Kode', 'Customer', 'Layanan', 'Tanggal', 'Status']}>
                    <tbody>
                        {rows.map((p) => (
                            <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                <Td className="font-mono" strong>{p.code}</Td>
                                <Td>{p.customer}</Td>
                                <Td strong>{p.layanan} <span className="font-normal" style={{ color: 'var(--color-muted)' }}>({TYPE_LABEL[p.type] || p.type})</span></Td>
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

import { Head } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { FadeIn, PageHeader, StatusBadge, Table, Td } from '@/Components/ui';

// Read-only: no action buttons on this page.
export default function PimpinanPemantauan({ auth, produk = [] }) {
    const rows = produk;

    return (
        <DashboardLayout title="Pemantauan" breadcrumb="Pimpinan RTPU / Pemantauan" activeKey="pantau">
            <Head title="Pemantauan Produk · PNJ Prime" />
            <FadeIn>
                <PageHeader
                    eyebrow="Pimpinan RTPU"
                    title="Pemantauan Produk, Sewa, dan Layanan"
                    desc="Produk dihitung dalam unit terjual; sewa dan layanan dihitung per pesanan yang sudah lunas."
                />
                <Table columns={['Kode', 'Nama', 'Jenis', 'Pemilik', 'Jumlah', 'Keterangan', 'Status katalog']}>
                    <tbody>
                        {rows.map((p) => (
                            <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                <Td className="font-mono" strong>{p.code}</Td>
                                <Td strong>{p.name}</Td>
                                <Td>{p.type === 'produk' ? 'Produk' : p.type === 'ruangan' ? 'Sewa' : 'Layanan'}</Td>
                                <Td>{p.owner || 'Tidak tersedia'}</Td>
                                <Td>{p.type === 'produk' ? `${p.sold_count} unit` : `${p.usage_count} kali`}</Td>
                                <Td>{p.type === 'produk' ? (p.sold_count > 0 ? 'Sudah terjual' : 'Belum terjual') : p.type === 'ruangan' ? (p.usage_count > 0 ? 'Sudah disewa' : 'Belum disewa') : (p.usage_count > 0 ? 'Sudah dipesan' : 'Belum dipesan')}</Td>
                                <Td><StatusBadge status={p.status} label={p.status} /></Td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </FadeIn>
        </DashboardLayout>
    );
}

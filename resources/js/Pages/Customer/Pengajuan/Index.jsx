import { Head } from '@inertiajs/react';
import { useState } from 'react';
import CustomerTabs from '@/Components/CustomerTabs';
import PublicLayout from '@/Layouts/PublicLayout';
import { EmptyState, FilterTabs, PageHeader, PrimaryButton, StatusBadge, Table, Td } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';
import { mockPengajuan } from '@/mocks/data';

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };

export default function PengajuanIndex({ auth, pengajuan }) {
    const role = auth?.user?.role;
    const rows = pengajuan ?? mockPengajuan.filter((p) => p.customer === (auth?.user?.name ?? ''));
    const list = rows.length > 0 ? rows : mockPengajuan;
    const [tipe, setTipe] = useState('all');
    const [status, setStatus] = useState('all');
    const visible = list.filter((p) => (tipe === 'all' || p.type === tipe) && (status === 'all' || p.status === status));

    return (
        <PublicLayout auth={auth}>
            <Head title="Pengajuan Saya · PNJ Prime" />
            <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">
                <PageHeader
                    eyebrow="Customer"
                    title="Pengajuan Saya"
                    desc="Pantau semua pengajuan layanan Anda yang masih berjalan."
                    actions={
                        <PrimaryButton href={navHref('customer.pengajuan.create', {}, role)}>
                            + Ajukan Layanan
                        </PrimaryButton>
                    }
                />
                <CustomerTabs active="pengajuan" role={role} />
                <div className="mb-4 flex flex-wrap gap-3">
                    <FilterTabs
                        tabs={[{ value: 'all', label: 'Semua tipe' }, { value: 'jasa', label: 'Jasa' }, { value: 'ruangan', label: 'Ruangan' }, { value: 'produk', label: 'Produk' }]}
                        active={tipe}
                        onChange={setTipe}
                    />
                    <FilterTabs
                        tabs={[{ value: 'all', label: 'Semua status' }, { value: 'Diajukan', label: 'Diajukan' }, { value: 'Menunggu Pembayaran', label: 'Menunggu Pembayaran' }, { value: 'Menunggu Verifikasi Pembayaran', label: 'Menunggu Verifikasi' }, { value: 'Diproses', label: 'Diproses' }]}
                        active={status}
                        onChange={setStatus}
                    />
                </div>
                {visible.length === 0 ? (
                    <EmptyState
                        title="Belum ada pengajuan"
                        desc="Ajukan layanan jasa, ruangan, atau produk pertama Anda."
                        action={
                            <PrimaryButton href={navHref('customer.pengajuan.create', {}, role)}>
                                + Ajukan Layanan
                            </PrimaryButton>
                        }
                    />
                ) : (
                    <Table columns={['Kode', 'Tipe', 'Layanan', 'Tanggal', 'Status', '']}>
                        <tbody>
                            {visible.map((p) => (
                                <tr key={p.id} className="transition-colors hover:bg-[var(--color-surface)]">
                                    <Td className="font-mono" strong>{p.code}</Td>
                                    <Td>{TYPE_LABEL[p.type] ?? p.type}</Td>
                                    <Td strong>{p.layanan}</Td>
                                    <Td><span style={{ color: 'var(--color-muted)' }}>{p.date}</span></Td>
                                    <Td><StatusBadge status={p.status} label={p.status} /></Td>
                                    <Td>
                                        <a href={navHref('customer.pengajuan.show', { id: p.id }, role)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                            Detail
                                        </a>
                                    </Td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                )}
            </div>
        </PublicLayout>
    );
}

import { Head, Link } from '@inertiajs/react';
import { Plus, ReceiptText } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import PublicLayout from '@/Layouts/PublicLayout';
import { EmptyState, FadeIn, FilterTabs, PageHeader, Pagination, PrimaryButton, StatusBadge, Table, Td, isInternalRole } from '@/Components/ui';

const STATUS_LABEL = {
    menunggu_pembayaran: 'Menunggu Pembayaran',
    menunggu_verifikasi: 'Menunggu Verifikasi',
    diproses: 'Diproses',
    selesai: 'Selesai',
    dibatalkan: 'Dibatalkan',
};

const TABS = [
    { value: 'all', label: 'Semua' },
    { value: 'menunggu_pembayaran', label: 'Menunggu Pembayaran' },
    { value: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
    { value: 'diproses', label: 'Diproses' },
    { value: 'selesai', label: 'Selesai' },
    { value: 'dibatalkan', label: 'Dibatalkan' },
];

function OrderTable({ orders }) {
    return (
        <Table columns={['No. Pesanan', 'Total', 'Status', 'Tanggal', '']}>
            <tbody>
                {orders.data.map((order) => (
                    <tr key={order.id} className="transition-colors hover:bg-[var(--color-surface)]">
                        <Td strong className="font-mono">{order.order_number}</Td>
                        <Td>Rp {Number(order.total ?? 0).toLocaleString('id-ID')}</Td>
                        <Td>
                            <StatusBadge status={order.status} label={STATUS_LABEL[order.status] ?? order.status} />
                        </Td>
                        <Td><span style={{ color: 'var(--color-muted)' }}>{new Date(order.created_at).toLocaleDateString('id-ID')}</span></Td>
                        <Td>
                            <Link href={route('transactions.show', order.id)} className="text-sm font-medium" style={{ color: 'var(--color-accent-hover)' }}>
                                Detail
                            </Link>
                        </Td>
                    </tr>
                ))}
            </tbody>
        </Table>
    );
}

export default function TransactionIndex({ auth, orders }) {
    const [filter, setFilter] = useState('all');
    const rows = orders?.data ?? [];
    const visible = filter === 'all' ? rows : rows.filter((o) => o.status === filter);
    const filteredOrders = { ...orders, data: visible };

    const content = (
        <>
            <PageHeader
                eyebrow="Transaksi"
                title="Riwayat Pesanan"
                desc="Pantau status pembayaran dan pesanan Anda. Pembayaran masuk ke rekening resmi PNJ."
                actions={
                    <PrimaryButton href={route('home')}>
                        <Plus className="h-4 w-4" /> Pesan Produk
                    </PrimaryButton>
                }
            />
            <div className="mb-4">
                <FilterTabs tabs={TABS} active={filter} onChange={setFilter} />
            </div>
            {visible.length === 0 ? (
                <EmptyState
                    icon={ReceiptText}
                    title={rows.length === 0 ? 'Belum ada pesanan' : 'Tidak ada pesanan pada filter ini'}
                    desc="Mulai belanja di katalog kami."
                />
            ) : (
                <>
                    <OrderTable orders={filteredOrders} />
                    {filter === 'all' && <Pagination links={orders?.links ?? []} meta={orders?.meta} />}
                </>
            )}
        </>
    );

    if (!isInternalRole(auth.user.role)) {
        return (
            <PublicLayout auth={auth}>
                <Head title="Transaksi — PNJ Prime" />
                <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">{content}</div>
            </PublicLayout>
        );
    }
    return (
        <DashboardLayout title="Transaksi" breadcrumb="PNJ Prime / Transaksi">
            <Head title="Transaksi — PNJ Prime" />
            <FadeIn>{content}</FadeIn>
        </DashboardLayout>
    );
}

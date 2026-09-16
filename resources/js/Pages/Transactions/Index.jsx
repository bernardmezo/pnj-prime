import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function TransactionIndex({ auth, orders }) {
    const statusLabel = {
        menunggu_pembayaran:  'Menunggu Pembayaran',
        menunggu_verifikasi:  'Menunggu Verifikasi',
        diproses:             'Diproses',
        selesai:              'Selesai',
        dibatalkan:           'Dibatalkan',
    };
    const statusColor = {
        menunggu_pembayaran:  'bg-yellow-100 text-yellow-700',
        menunggu_verifikasi:  'bg-blue-100 text-blue-700',
        diproses:             'bg-prime-100 text-prime-700',
        selesai:              'bg-green-100 text-green-700',
        dibatalkan:           'bg-red-100 text-red-700',
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-prime-900">Transaksi</h2>}>
            <Head title="Transaksi — PNJ Prime" />

            <div className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-prime-900">Riwayat Pesanan</h1>
                        <Link href={route('home')} className="rounded-xl bg-prime-gradient px-5 py-2.5 text-sm font-semibold text-white">
                            + Pesan Produk
                        </Link>
                    </div>

                    {orders.data.length === 0 ? (
                        <div className="rounded-2xl bg-white shadow-card p-12 text-center">
                            <p className="text-5xl mb-3">🧾</p>
                            <p className="text-lg font-semibold text-prime-900">Belum ada pesanan</p>
                            <p className="mt-1 text-gray-500">Mulai belanja di katalog kami.</p>
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white shadow-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-surface-subtle text-left text-xs font-semibold uppercase text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">No. Pesanan</th>
                                        <th className="px-6 py-3">Total</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3">Tanggal</th>
                                        <th className="px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border">
                                    {orders.data.map((order) => (
                                        <tr key={order.id} className="hover:bg-surface-muted transition-colors">
                                            <td className="px-6 py-4 font-mono font-medium text-prime-900">
                                                {order.order_number}
                                            </td>
                                            <td className="px-6 py-4">
                                                Rp {Number(order.total).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor[order.status] ?? ''}`}>
                                                    {statusLabel[order.status] ?? order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link href={route('transactions.show', order.id)} className="text-prime-500 hover:underline">
                                                    Detail
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

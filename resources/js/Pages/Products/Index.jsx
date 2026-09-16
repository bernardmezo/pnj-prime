import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function ProductIndex({ auth, products }) {
    const canCreate = ['admin_rtpu', 'dosen_peneliti', 'mahasiswa'].includes(auth.user.role);

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-prime-900">Manajemen Produk</h2>}>
            <Head title="Produk — PNJ Prime" />

            <div className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-prime-900">Daftar Produk</h1>
                        {canCreate && (
                            <Link
                                href={route('products.create')}
                                className="rounded-xl bg-prime-gradient px-5 py-2.5 text-sm font-semibold text-white shadow-card hover:opacity-90"
                            >
                                + Tambah Produk
                            </Link>
                        )}
                    </div>

                    {products.data.length === 0 ? (
                        <EmptyState canCreate={canCreate} />
                    ) : (
                        <div className="rounded-2xl bg-white shadow-card overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-surface-subtle text-left text-xs font-semibold uppercase text-gray-500">
                                    <tr>
                                        <th className="px-6 py-3">Nama Produk</th>
                                        <th className="px-6 py-3">Kategori</th>
                                        <th className="px-6 py-3">Harga</th>
                                        <th className="px-6 py-3">Status Kurasi</th>
                                        <th className="px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border">
                                    {products.data.map((product) => (
                                        <tr key={product.id} className="hover:bg-surface-muted transition-colors">
                                            <td className="px-6 py-4 font-medium text-prime-900">{product.name}</td>
                                            <td className="px-6 py-4 text-gray-600">{product.category?.name}</td>
                                            <td className="px-6 py-4">Rp {Number(product.final_price).toLocaleString('id-ID')}</td>
                                            <td className="px-6 py-4">
                                                <CurationBadge status={product.curation_status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link href={route('products.edit', product.id)} className="text-prime-500 hover:underline">
                                                    Edit
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

function CurationBadge({ status }) {
    const styles = {
        draft:    'bg-gray-100 text-gray-600',
        pending:  'bg-yellow-100 text-yellow-700',
        approved: 'bg-green-100 text-green-700',
        rejected: 'bg-red-100 text-red-700',
    };
    const labels = {
        draft: 'Draft', pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak',
    };
    return (
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? ''}`}>
            {labels[status] ?? status}
        </span>
    );
}

function EmptyState({ canCreate }) {
    return (
        <div className="rounded-2xl bg-white shadow-card p-12 text-center">
            <p className="text-5xl mb-4">📦</p>
            <p className="text-lg font-semibold text-prime-900">Belum ada produk</p>
            <p className="mt-1 text-gray-500">
                {canCreate ? 'Mulai tambahkan produk inovasi Anda.' : 'Tidak ada produk yang dapat ditampilkan.'}
            </p>
            {canCreate && (
                <Link href={route('products.create')} className="mt-4 inline-block rounded-xl bg-prime-gradient px-6 py-2.5 text-sm font-semibold text-white">
                    + Tambah Produk
                </Link>
            )}
        </div>
    );
}

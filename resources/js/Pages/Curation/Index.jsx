import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function CurationIndex({ pending_products, stats }) {
    function handleApprove(productId) {
        router.patch(route('admin.curation.approve', productId));
    }

    function handleReject(productId) {
        const reason = prompt('Alasan penolakan:');
        if (reason) {
            router.patch(route('admin.curation.reject', productId), { rejection_reason: reason });
        }
    }

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-prime-900">Antrian Kurasi</h2>}>
            <Head title="Kurasi Produk — PNJ Prime" />

            <div className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        {[
                            { label: 'Menunggu', value: stats.pending, color: 'text-yellow-600' },
                            { label: 'Disetujui', value: stats.approved, color: 'text-green-600' },
                            { label: 'Ditolak', value: stats.rejected, color: 'text-red-600' },
                        ].map((s) => (
                            <div key={s.label} className="rounded-xl bg-white shadow-card p-5 text-center">
                                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                            </div>
                        ))}
                    </div>

                    {/* Pending products */}
                    <h3 className="text-lg font-semibold text-prime-900 mb-4">Menunggu Tinjauan</h3>
                    {pending_products.data.length === 0 ? (
                        <div className="rounded-2xl bg-white shadow-card p-10 text-center text-gray-500">
                            ✅ Tidak ada produk yang menunggu kurasi.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pending_products.data.map((product) => (
                                <div key={product.id} className="flex items-center justify-between rounded-xl bg-white shadow-card px-6 py-4">
                                    <div>
                                        <p className="font-semibold text-prime-900">{product.name}</p>
                                        <p className="text-sm text-gray-500">
                                            {product.category?.name} · oleh {product.owner?.name}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleApprove(product.id)}
                                            className="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600 transition-colors"
                                        >
                                            Setujui
                                        </button>
                                        <button
                                            onClick={() => handleReject(product.id)}
                                            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
                                        >
                                            Tolak
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

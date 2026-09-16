import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function OwnerReport({ summary }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-prime-900">Laporan Saya</h2>}>
            <Head title="Laporan — PNJ Prime" />
            <div className="py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-2xl bg-white shadow-card p-10 text-center text-gray-400">
                        <p className="text-4xl mb-3">📈</p>
                        <p className="text-lg font-medium">Laporan Transaksi Produk Anda</p>
                        <p className="text-sm mt-1">Implementasi dalam progress.</p>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Checkout({ payment_info }) {
    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold text-prime-900">Checkout</h2>}>
            <Head title="Checkout — PNJ Prime" />

            <div className="py-10">
                <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                    {/* Payment instructions */}
                    <div className="rounded-2xl bg-white shadow-card p-8 mb-6">
                        <h3 className="text-lg font-bold text-prime-900 mb-4">Instruksi Pembayaran</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Transfer pembayaran ke rekening BLU PNJ berikut, kemudian unggah bukti transfer.
                        </p>
                        <div className="rounded-xl bg-surface-subtle p-5 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Bank</span>
                                <span className="font-semibold text-prime-900">{payment_info.bank}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">No. Rekening</span>
                                <span className="font-mono font-bold text-prime-900 text-lg">
                                    {payment_info.account || '— (belum dikonfigurasi)'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Atas Nama</span>
                                <span className="font-semibold text-prime-900">{payment_info.holder}</span>
                            </div>
                        </div>
                    </div>

                    {/* Upload proof */}
                    <div className="rounded-2xl bg-white shadow-card p-8">
                        <h3 className="text-lg font-bold text-prime-900 mb-4">Unggah Bukti Transfer</h3>
                        <p className="text-xs text-gray-400 mb-4">
                            Format yang diterima: JPG, PNG, PDF. Maks. 5 MB.
                        </p>
                        <div className="border-2 border-dashed border-surface-border rounded-xl p-8 text-center text-gray-400">
                            <p className="text-3xl mb-2">📎</p>
                            <p>TODO: implementasi file upload</p>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

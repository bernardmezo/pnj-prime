import { Head, Link } from '@inertiajs/react';

export default function CatalogShow({ product }) {
    return (
        <>
            <Head title={`${product.name} — PNJ Prime`} />

            <div className="min-h-screen bg-surface-muted">
                <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                    <Link href={route('home')} className="text-sm text-prime-500 hover:underline">
                        ← Kembali ke Katalog
                    </Link>

                    <div className="mt-6 rounded-2xl bg-white shadow-card overflow-hidden">
                        <div className="h-56 bg-surface-subtle flex items-center justify-center text-7xl">
                            📦
                        </div>
                        <div className="p-8">
                            <span className="inline-block rounded-full bg-prime-100 px-3 py-1 text-xs font-medium text-prime-700">
                                {product.category?.name}
                            </span>
                            <h1 className="mt-3 text-3xl font-bold text-prime-900">{product.name}</h1>
                            <p className="mt-1 text-sm text-gray-500">oleh {product.owner?.name}</p>

                            <p className="mt-4 text-gray-700">{product.short_description}</p>

                            <div className="mt-6 flex items-center justify-between">
                                <p className="text-3xl font-extrabold text-prime-900">
                                    Rp {Number(product.final_price).toLocaleString('id-ID')}
                                </p>
                                <Link
                                    href={route('transactions.checkout')}
                                    className="rounded-xl bg-prime-gradient px-6 py-3 font-semibold text-white shadow-glow hover:opacity-90 transition-opacity"
                                >
                                    Pesan Sekarang
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

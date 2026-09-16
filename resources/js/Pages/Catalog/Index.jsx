import { Head, Link } from '@inertiajs/react';

export default function CatalogIndex({ categories = [], featured_products = [] }) {
    return (
        <>
            <Head title="Katalog Produk — PNJ Prime" />

            {/* Hero */}
            <section className="bg-prime-gradient py-20 text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
                        PNJ <span className="text-gold-400">PRIME</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-prime-100">
                        Platform Marketplace Digital Politeknik Negeri Jakarta —
                        produk, jasa, dan fasilitas inovasi terbaik sivitas akademika PNJ.
                    </p>
                    <Link
                        href={route('login')}
                        className="mt-8 inline-block rounded-xl bg-gold-400 px-8 py-3 font-semibold text-prime-950 shadow-glow hover:bg-gold-300 transition-colors"
                    >
                        Masuk / Daftar
                    </Link>
                </div>
            </section>

            {/* Categories */}
            <section className="py-12 bg-surface-muted">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-prime-900 mb-6">Kategori</h2>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className="rounded-xl border border-surface-border bg-white p-6 shadow-card text-center"
                            >
                                <p className="text-4xl mb-2">{cat.icon ?? '📦'}</p>
                                <p className="font-semibold text-prime-900">{cat.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-12 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-prime-900 mb-6">Produk Unggulan</h2>
                    {featured_products.length === 0 ? (
                        <p className="text-gray-500">Belum ada produk yang ditampilkan.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {featured_products.map((product) => (
                                <Link
                                    key={product.id}
                                    href={route('catalog.show', product.slug)}
                                    className="group rounded-xl border border-surface-border bg-white shadow-card hover:shadow-modal transition-all duration-200 overflow-hidden"
                                >
                                    <div className="h-40 bg-surface-subtle flex items-center justify-center text-5xl">
                                        📦
                                    </div>
                                    <div className="p-4">
                                        <p className="text-xs font-medium text-prime-500 uppercase tracking-wide">
                                            {product.category?.name}
                                        </p>
                                        <p className="mt-1 font-semibold text-prime-900 group-hover:text-prime-500 transition-colors line-clamp-2">
                                            {product.name}
                                        </p>
                                        <p className="mt-2 text-lg font-bold text-prime-900">
                                            Rp {Number(product.final_price).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

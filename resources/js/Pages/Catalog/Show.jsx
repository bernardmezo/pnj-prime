import { Head, Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Building2, Check, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { VisualPlaceholder } from '@/Components/Public/shared';
import { Card, EASE, StatusBadge } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

const TYPE_LABEL = { jasa: 'Jasa', ruangan: 'Ruangan', produk: 'Produk' };

function typeFromSlug(slug) {
    const s = String(slug ?? '');
    if (s.includes('jasa')) return 'jasa';
    if (s.includes('sewa') || s.includes('fasilitas')) return 'ruangan';
    return 'produk';
}

export default function CatalogShow({ auth, product }) {
    const reduce = useReducedMotion();
    const [tab, setTab] = useState('deskripsi');
    const user = auth?.user;
    const type = typeFromSlug(product.category?.slug);
    const price = `Rp ${Number(product.final_price ?? 0).toLocaleString('id-ID')}`;
    const specs =
        type === 'jasa'
            ? [
                ['Kategori', product.category?.name ?? '-'],
                ['Lokasi', product.location ?? 'Gedung RTPU PNJ'],
                ['Estimasi', product.duration ?? '-'],
                ['Status', 'Tersedia'],
            ]
            : type === 'ruangan'
              ? [
                ['Kategori', product.category?.name ?? '-'],
                ['Lokasi', product.location ?? 'Kampus PNJ Depok'],
                ['Kapasitas', product.capacity ?? '-'],
                ['Status', 'Tersedia'],
            ]
              : [
                ['Kategori', product.category?.name ?? '-'],
                ['Diajukan oleh', product.owner?.name ?? '-'],
                ['Stok', product.stock ?? '-'],
                ['Status', 'Tersedia'],
            ];

    return (
        <PublicLayout auth={auth}>
            <Head title={`${product.name} · PNJ Prime`} />

            <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6">
                {/* Breadcrumb */}
                <nav className="mb-6 flex items-center gap-2 text-[13px]" style={{ color: 'var(--color-muted)' }} aria-label="Breadcrumb">
                    <Link href={route('home')} className="transition hover:underline" style={{ color: 'var(--color-accent-hover)' }}>
                        Beranda
                    </Link>
                    <span>/</span>
                    <Link href={route('home')} className="transition hover:underline" style={{ color: 'var(--color-accent-hover)' }}>
                        Katalog
                    </Link>
                    <span>/</span>
                    <span className="truncate" style={{ color: 'var(--color-ink)' }}>{product.name}</span>
                </nav>

                <motion.div
                    initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                >
                    <Card className="overflow-hidden">
                        <div className="grid lg:grid-cols-2">
                            {/* Gallery */}
                            <div className="p-4 sm:p-6">
                                <div className="overflow-hidden rounded-2xl border" style={{ borderColor: 'var(--color-border)' }}>
                                    <VisualPlaceholder icon={Building2} image={product.image ?? null} alt={product.name} className="aspect-[4/3] w-full" />
                                </div>
                            </div>
                            {/* Info */}
                            <div className="flex flex-col p-6 sm:p-8 lg:pl-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold" style={{ color: 'var(--color-accent-hover)' }}>
                                        {TYPE_LABEL[type]} · {product.category?.name ?? 'Produk PNJ'}
                                    </span>
                                    <StatusBadge label="Tersedia" tone="teal" />
                                </div>
                                <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-ink)' }}>
                                    {product.name}
                                </h1>
                                <p className="mt-1 text-sm" style={{ color: 'var(--color-muted)' }}>
                                    oleh {product.owner?.name ?? 'PNJ'}
                                </p>
                                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                                    {product.short_description}
                                </p>
                                <p className="mt-5 font-display text-3xl font-bold" style={{ color: 'var(--color-ink)' }}>
                                    {price}
                                </p>
                                <div className="mt-5 flex flex-wrap items-center gap-2 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                                    <ShieldCheck className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
                                    Terkurasi Admin RTPU · pembayaran ke rekening resmi PNJ
                                </div>
                                <div className="mt-6 flex flex-wrap gap-3">
                                    {user ? (
                                        <a
                                            href={navHref('customer.pengajuan.create', { product_id: product.id, tipe: type }, user.role)}
                                            className="group inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-px active:scale-[0.98]"
                                            style={{ background: 'var(--color-accent)' }}
                                        >
                                            Ajukan Layanan
                                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                        </a>
                                    ) : (
                                        <Link
                                            href={route('login')}
                                            className="group inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition hover:-translate-y-px active:scale-[0.98]"
                                            style={{ background: 'var(--color-accent)' }}
                                        >
                                            Masuk untuk Mengajukan
                                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                        </Link>
                                    )}
                                    <Link
                                        href={route('catalog.index')}
                                        className="group inline-flex items-center gap-2 rounded-full border bg-white px-6 py-2.5 text-sm font-semibold transition hover:-translate-y-px"
                                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                                    >
                                        <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                                        Kembali
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="border-t px-6 py-6 sm:px-8" style={{ borderColor: 'var(--color-border)' }}>
                            <div className="flex gap-2 border-b pb-px" style={{ borderColor: 'var(--color-border)' }} role="tablist">
                                {[
                                    ['deskripsi', 'Deskripsi'],
                                    ['spesifikasi', 'Spesifikasi'],
                                ].map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        role="tab"
                                        aria-selected={tab === key}
                                        onClick={() => setTab(key)}
                                        className="relative px-4 py-2.5 text-sm font-semibold transition"
                                        style={{ color: tab === key ? 'var(--color-accent-hover)' : 'var(--color-muted)' }}
                                    >
                                        {label}
                                        {tab === key && (
                                            <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
                                        )}
                                    </button>
                                ))}
                            </div>
                            {tab === 'deskripsi' ? (
                                <p className="mt-4 max-w-3xl text-[15px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                                    {product.description ?? product.short_description ?? 'Deskripsi produk belum tersedia.'}
                                </p>
                            ) : (
                                <dl className="mt-4 grid max-w-3xl gap-3 sm:grid-cols-2">
                                    {specs.map(([k, v]) => (
                                        <div key={k} className="flex items-start gap-2 rounded-xl px-4 py-3" style={{ background: 'var(--color-surface)' }}>
                                            <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                                            <div>
                                                <dt className="text-xs" style={{ color: 'var(--color-muted)' }}>{k}</dt>
                                                <dd className="text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>{String(v)}</dd>
                                            </div>
                                        </div>
                                    ))}
                                </dl>
                            )}
                        </div>
                    </Card>
                </motion.div>

                <div className="mt-8 text-center">
                    <Link
                        href={route('catalog.index')}
                        className="group inline-flex items-center gap-2 text-sm font-semibold"
                        style={{ color: 'var(--color-accent-hover)' }}
                    >
                        Jelajahi katalog lainnya
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                </div>
            </div>
        </PublicLayout>
    );
}

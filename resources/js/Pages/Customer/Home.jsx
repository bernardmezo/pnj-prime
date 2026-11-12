import { Head } from '@inertiajs/react';
import { ArrowRight, Building2, Clock, FileText, FlaskConical, Package, Search, ShoppingBag, Sparkles } from 'lucide-react';
import { useState } from 'react';
import CatalogCard, { typeFromCategory } from '@/Components/Public/CatalogCard';
import PublicLayout from '@/Layouts/PublicLayout';
import { PrimaryButton } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

function toCard(p) {
    return {
        id: p.id,
        type: typeFromCategory(p.category?.slug),
        title: p.name,
        category_name: p.category?.name,
        target_audience: p.target_audience ?? 'publik',
        price: `Rp ${Number(p.final_price ?? 0).toLocaleString('id-ID')}`,
        image: p.thumbnail ?? null,
        slug: p.slug,
        stock: p.stock ?? null,
        availability_status: p.meta?.availability_status ?? 'tersedia',
        preorder_duration: p.meta?.preorder_duration ?? null,
        sold_count: p.sold_count ?? 0,
    };
}

export default function CustomerHome({ auth, featured_products = [], categories = [] }) {
    const role = auth?.user?.role;
    const [q, setQ] = useState('');
    const items = featured_products.map(toCard);

    return (
        <PublicLayout auth={auth}>
            <Head title="Beranda · PNJ Prime" />
            <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6">
                {/* Greeting + search */}
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent-tint)] px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
                            <Sparkles className="h-3.5 w-3.5 text-[var(--color-gold)]" />
                            Halo, {auth?.user?.name?.split(' ')[0] ?? 'Pelanggan'}
                        </div>
                        <h1 className="mt-2 font-display text-[28px] font-bold tracking-tight sm:text-4xl" style={{ color: 'var(--color-ink)' }}>
                            Mau pesan apa hari ini?
                        </h1>
                        <p className="mt-1 text-xs sm:text-sm text-[var(--color-muted)]">
                            Jelajahi inovasi riset, pengujian laboratorium, dan fasilitas resmi PNJ.
                        </p>
                    </div>
                    <form
                        className="relative w-full max-w-md"
                        onSubmit={(e) => {
                            e.preventDefault();
                            window.location.href = q.trim() ? `/katalog?q=${encodeURIComponent(q.trim())}` : '/katalog';
                        }}
                    >
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
                        <input
                            type="search"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Cari produk, jasa laboratorium, atau fasilitas…"
                            aria-label="Cari katalog"
                            className="w-full rounded-full border border-[var(--color-border)] bg-white py-3.5 pl-11 pr-4 text-sm text-[var(--color-ink)] shadow-sm outline-none transition duration-150 focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-tint)]"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-tint)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                    </form>
                </div>

                {/* Category chips */}
                <div className="mt-6 flex flex-wrap gap-2.5">
                    {(categories.length > 0
                        ? categories
                        : [{ id: 'jasa', name: 'Jasa & Uji Lab', slug: 'jasa' }, { id: 'ruangan', name: 'Ruangan & Fasilitas', slug: 'ruangan' }, { id: 'produk', name: 'Produk Riset', slug: 'produk' }]
                    ).map((c) => {
                        const icon = c.slug?.includes('jasa') ? FlaskConical : c.slug?.includes('ruangan') || c.slug?.includes('sewa') ? Building2 : Package;
                        const Icon = icon;
                        return (
                            <a
                                key={c.id ?? c.slug}
                                href={c.slug ? `/katalog?category=${encodeURIComponent(c.slug)}` : '/katalog'}
                                className="group inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-ink)] shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-tint)] hover:text-[var(--color-accent)]"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                            >
                                <Icon className="h-4 w-4 text-[var(--color-accent)] opacity-75 group-hover:opacity-100 transition-opacity" />
                                <span>{c.name}</span>
                            </a>
                        );
                    })}
                </div>

                {/* Catalog grid */}
                <div className="mt-10 flex items-end justify-between gap-4">
                    <div>
                        <h2 className="flex items-center gap-2 font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-gold)' }} />
                            Pilihan Terkurasi untuk Anda
                        </h2>
                        <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                            Produk dan jasa unggulan yang telah diverifikasi oleh pimpinan &amp; pengelola.
                        </p>
                    </div>
                    <a href="/katalog" className="group inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors">
                        Lihat semua
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                </div>
                <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((item, i) => (
                        <CatalogCard key={item.id} item={item} index={i % 4} />
                    ))}
                </div>

                {/* Custom request CTA */}
                <div
                    className="relative mt-12 overflow-hidden flex flex-wrap items-center justify-between gap-6 rounded-3xl p-7 sm:p-9 shadow-lg text-white"
                    style={{
                        background: 'linear-gradient(135deg, var(--color-deep) 0%, var(--color-deep-soft) 100%)',
                    }}
                >
                    {/* Top speed-line accent inspired by Prime logo */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-gold)] via-[var(--color-accent)] to-[var(--color-gold)]" />

                    <div className="relative z-10 max-w-xl">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[var(--color-gold)] backdrop-blur-sm mb-3">
                            <Sparkles className="h-3.5 w-3.5" />
                            Layanan Khusus &amp; Kustomisasi
                        </span>
                        <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                            Butuh layanan atau pengujian khusus?
                        </h2>
                        <p className="mt-2 text-sm text-white/80 leading-relaxed">
                            Ajukan kebutuhan jasa pengujian, penyewaan fasilitas kampus, atau pemesanan produk kustom langsung ke tim pengelola kami.
                        </p>
                    </div>
                    <div className="relative z-10">
                        <PrimaryButton href={navHref('customer.pengajuan.create', {}, role)} className="shadow-md">
                            Ajukan Layanan <ArrowRight className="h-4 w-4 ml-1" />
                        </PrimaryButton>
                    </div>
                </div>

                {/* Account shortcuts */}
                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {[
                        ['Pengajuan Saya', 'Pantau status permohonan layanan Anda secara real-time.', 'customer.pengajuan.index', FileText],
                        ['Riwayat Transaksi', 'Daftar transaksi dan faktur yang telah selesai.', 'customer.riwayat', Clock],
                        ['Katalog Lengkap', 'Jelajahi seluruh koleksi produk dan jasa riset.', 'catalog', ShoppingBag],
                    ].map(([label, desc, page, Icon]) => (
                        <a
                            key={label}
                            href={page === 'catalog' ? '/katalog' : navHref(page, {}, role)}
                            className="group flex flex-col justify-between rounded-2xl border border-[var(--color-border)] bg-white shadow-card p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--color-accent)] hover:shadow-card-hover"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-accent-tint)] text-[var(--color-accent)] transition-transform duration-300 group-hover:scale-105">
                                    <Icon className="h-5 w-5" />
                                </div>
                                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 text-[var(--color-muted)] group-hover:text-[var(--color-accent)]" />
                            </div>
                            <div className="mt-4">
                                <span className="block font-display text-[15px] font-semibold text-[var(--color-ink)] group-hover:text-[var(--color-accent)] transition-colors">
                                    {label}
                                </span>
                                <span className="mt-1 block text-xs text-[var(--color-muted)] leading-normal">
                                    {desc}
                                </span>
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}


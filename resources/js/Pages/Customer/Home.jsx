import { Head } from '@inertiajs/react';
import { ArrowRight, Search } from 'lucide-react';
import { useState } from 'react';
import CatalogCard from '@/Components/Public/CatalogCard';
import PublicLayout from '@/Layouts/PublicLayout';
import { PrimaryButton } from '@/Components/ui';
import { href as navHref } from '@/lib/nav';

function toCard(p) {
    const type = String(p.category?.slug ?? '').includes('jasa')
        ? 'jasa'
        : String(p.category?.slug ?? '').match(/sewa|fasilitas/)
          ? 'sewa'
          : 'produk';
    return {
        id: p.id,
        type,
        title: p.name,
        category_name: p.category?.name,
        price: `Rp ${Number(p.final_price ?? 0).toLocaleString('id-ID')}`,
        image: p.thumbnail ?? null,
        slug: p.slug,
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
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                            Halo, {auth?.user?.name?.split(' ')[0] ?? 'Pelanggan'}
                        </p>
                        <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl" style={{ color: 'var(--color-ink)' }}>
                            Mau pesan apa hari ini?
                        </h1>
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
                            placeholder="Cari produk, jasa, atau fasilitas…"
                            aria-label="Cari katalog"
                            className="w-full rounded-full border bg-white py-3 pl-11 pr-4 text-sm outline-none transition"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                            onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-accent-tint)'; }}
                            onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none'; }}
                        />
                    </form>
                </div>

                {/* Category chips */}
                <div className="mt-5 flex flex-wrap gap-2">
                    {(categories.length > 0
                        ? categories
                        : [{ id: 'jasa', name: 'Jasa', slug: '' }, { id: 'ruangan', name: 'Ruangan', slug: '' }, { id: 'produk', name: 'Produk', slug: '' }]
                    ).map((c) => (
                        <a
                            key={c.id ?? c.slug}
                            href={c.slug ? `/katalog?category=${encodeURIComponent(c.slug)}` : '/katalog'}
                            className="rounded-full border bg-white px-5 py-2 text-sm font-medium transition hover:-translate-y-px"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                        >
                            {c.name}
                        </a>
                    ))}
                </div>

                {/* Catalog grid */}
                <div className="mt-8 flex items-end justify-between gap-4">
                    <h2 className="font-display text-xl font-bold" style={{ color: 'var(--color-ink)' }}>
                        Pilihan untuk Anda
                    </h2>
                    <a href="/katalog" className="group inline-flex items-center gap-1 text-sm font-semibold" style={{ color: 'var(--color-accent-hover)' }}>
                        Lihat semua
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </a>
                </div>
                <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {items.map((item, i) => (
                        <CatalogCard key={item.id} item={item} index={i % 4} />
                    ))}
                </div>

                {/* Custom request CTA */}
                <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl p-6 sm:p-8" style={{ background: 'var(--color-deep)' }}>
                    <div>
                        <h2 className="font-display text-xl font-bold text-white sm:text-2xl">
                            Butuh sesuatu yang khusus?
                        </h2>
                        <p className="mt-1 max-w-md text-sm text-white/70">
                            Ajukan layanan jasa, ruangan, atau produk sesuai kebutuhan Anda, kami siapkan penawarannya.
                        </p>
                    </div>
                    <PrimaryButton href={navHref('customer.pengajuan.create', {}, role)}>
                        Ajukan Layanan <ArrowRight className="h-4 w-4" />
                    </PrimaryButton>
                </div>

                {/* Account shortcuts */}
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {[
                        ['Pengajuan Saya', 'Pantau status pengajuan berjalan.', 'customer.pengajuan.index'],
                        ['Riwayat', 'Transaksi yang sudah selesai.', 'customer.riwayat'],
                        ['Katalog Lengkap', 'Jelajahi semua layanan.', 'catalog'],
                    ].map(([label, desc, page]) => (
                        <a
                            key={label}
                            href={page === 'catalog' ? '/katalog' : navHref(page, {}, role)}
                            className="group rounded-2xl border bg-white p-5 transition hover:-translate-y-0.5"
                            style={{ borderColor: 'var(--color-border)' }}
                        >
                            <span className="flex items-center justify-between font-display text-[15px] font-semibold" style={{ color: 'var(--color-ink)' }}>
                                {label}
                                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" style={{ color: 'var(--color-accent-hover)' }} />
                            </span>
                            <span className="mt-0.5 block text-[13px]" style={{ color: 'var(--color-muted)' }}>{desc}</span>
                        </a>
                    ))}
                </div>
            </div>
        </PublicLayout>
    );
}


import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';

const NAV_LINKS = [
    { label: 'Beranda', href: '/' },
    { label: 'Katalog', href: '#katalog' },
    { label: 'Tentang', href: '#tentang' },
    { label: 'Kontak', href: '#kontak' },
];

const ABOUT_POINTS = [
    {
        title: 'Pengajuan terarah',
        text: 'Inovasi diajukan oleh Admin P3M sebagai pengelola riset dan produk unggulan.',
    },
    {
        title: 'Kurasi berlapis',
        text: 'Setiap pengajuan ditinjau dan dikelola oleh Admin RTPU sebelum tayang ke publik.',
    },
    {
        title: 'Transaksi resmi',
        text: 'Dana masuk langsung ke rekening PNJ dengan verifikasi manual yang transparan.',
    },
];

export default function CatalogIndex({ auth, categories = [], featured_products = [] }) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <Head title="PNJ Prime — Marketplace Inovasi Politeknik Negeri Jakarta" />

            {/* ---------- Header ---------- */}
            <header className="sticky top-0 z-50 border-b border-surface-border bg-white/90 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
                    <Link href={route('home')} className="flex items-center gap-2.5">
                        <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                            <img
                                src="/assets/logo.PNG"
                                alt="Logo PNJ Prime"
                                className="h-full w-full object-contain"
                            />
                        </span>
                        <span>
                            <span className="block font-display text-base font-bold leading-tight text-prime-950">
                                PNJ Prime
                            </span>
                            <span className="block text-[11px] text-gray-500">
                                Politeknik Negeri Jakarta
                            </span>
                        </span>
                    </Link>

                    <nav className="hidden items-center gap-8 md:flex" aria-label="Navigasi utama">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                className="relative text-sm font-medium text-prime-950 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-gold-400 after:transition-all hover:after:w-full"
                            >
                                {link.label}
                            </a>
                        ))}
                    </nav>

                    <div className="hidden items-center gap-3 md:flex">
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-full bg-prime-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-prime-700"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="rounded-full border border-surface-border bg-white px-6 py-2.5 text-sm font-semibold text-prime-950 shadow-sm transition hover:border-prime-500 hover:text-prime-600"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="rounded-full bg-prime-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-prime-700"
                                >
                                    Daftar
                                </Link>
                            </>
                        )}
                    </div>

                    <button
                        className="p-2 md:hidden"
                        aria-label="Buka menu navigasi"
                        onClick={() => setMenuOpen((open) => !open)}
                    >
                        <span className="my-1 block h-0.5 w-5 bg-prime-950" />
                        <span className="my-1 block h-0.5 w-5 bg-prime-950" />
                        <span className="my-1 block h-0.5 w-5 bg-prime-950" />
                    </button>
                </div>

                {menuOpen && (
                    <nav
                        className="flex flex-col gap-3 border-t border-surface-border bg-white px-6 py-4 md:hidden"
                        aria-label="Navigasi seluler"
                    >
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.label}
                                href={link.href}
                                onClick={() => setMenuOpen(false)}
                                className="text-sm font-medium text-prime-950"
                            >
                                {link.label}
                            </a>
                        ))}
                        {auth?.user ? (
                            <Link
                                href={route('dashboard')}
                                className="mt-1 rounded-full bg-prime-600 px-6 py-2.5 text-center text-sm font-semibold text-white"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <div className="mt-1 flex gap-3">
                                <Link
                                    href={route('login')}
                                    className="flex-1 rounded-full border border-surface-border px-6 py-2.5 text-center text-sm font-semibold text-prime-950"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="flex-1 rounded-full bg-prime-600 px-6 py-2.5 text-center text-sm font-semibold text-white"
                                >
                                    Daftar
                                </Link>
                            </div>
                        )}
                    </nav>
                )}
            </header>

            {/* ---------- Hero ---------- */}
            <section className="relative overflow-hidden bg-prime-gradient text-white">
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.14),transparent_70%)]"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-48 -left-44 h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle_at_60%_60%,rgba(240,195,77,0.18),transparent_70%)]"
                />
                <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1fr_0.85fr] lg:px-8">
                    <div>
                        <span className="mb-4 block text-sm font-semibold text-gold-400">
                            Rekayasa Teknologi &amp; Produk Unggulan
                        </span>
                        <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                            Inovasi PNJ, kini{' '}
                            <em className="bg-[linear-gradient(180deg,transparent_62%,rgba(240,195,77,0.45)_62%)] not-italic">
                                siap dipakai
                            </em>{' '}
                            oleh siapa saja
                        </h1>
                        <p className="mt-6 max-w-xl text-lg text-prime-100">
                            PNJ Prime mempertemukan produk, layanan, dan fasilitas
                            unggulan hasil riset kampus dengan masyarakat, industri,
                            dan mitra kerja sama — lewat proses kurasi yang jelas dan
                            transparan.
                        </p>
                        <div className="mt-8 flex flex-wrap gap-3">
                            <a
                                href="#katalog"
                                className="rounded-full bg-gold-400 px-7 py-3.5 text-[15px] font-semibold text-prime-950 shadow-glow transition hover:-translate-y-0.5 hover:bg-gold-300"
                            >
                                Jelajahi Produk
                            </a>
                            <a
                                href="#tentang"
                                className="rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition hover:bg-white/20"
                            >
                                Tentang Kami
                            </a>
                        </div>
                        <div className="mt-8 flex items-center gap-3 text-sm text-white/75">
                            <span className="flex" aria-hidden>
                                <span className="inline-block h-8 w-8 rounded-full border-2 border-prime-800 bg-prime-200" />
                                <span className="-ml-2 inline-block h-8 w-8 rounded-full border-2 border-prime-800 bg-prime-200" />
                                <span className="-ml-2 inline-block h-8 w-8 rounded-full border-2 border-prime-800 bg-prime-400" />
                            </span>
                            Dipercaya oleh 35+ inovator &amp; mitra PNJ
                        </div>
                    </div>

                    <div className="relative mx-auto w-full max-w-md">
                        <div className="overflow-hidden rounded-3xl bg-prime-900 shadow-modal">
                            <img
                                src="/assets/logo.PNG"
                                alt="Logo RTPU Politeknik Negeri Jakarta"
                                className="aspect-[3/3.4] w-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------- Featured preview ---------- */}
            <section id="katalog" className="scroll-mt-20 bg-surface-muted py-16 md:py-24">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <span className="mb-2 block text-sm font-semibold text-prime-600">
                                Katalog Pilihan
                            </span>
                            <h2 className="font-display text-2xl font-bold text-prime-950 sm:text-3xl">
                                Intip produk unggulan terbaru
                            </h2>
                        </div>
                        <span className="flex items-center gap-1.5 text-sm text-gray-500">
                            Geser untuk melihat lebih banyak →
                        </span>
                    </div>

                    {featured_products.length === 0 ? (
                        <p className="rounded-2xl border border-dashed border-surface-border bg-white p-10 text-center text-gray-500">
                            Belum ada produk yang ditampilkan.
                        </p>
                    ) : (
                        <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {featured_products.map((product) => (
                                <Link
                                    key={product.id}
                                    href={route('catalog.show', product.slug)}
                                    className="group w-[270px] shrink-0 snap-start overflow-hidden rounded-3xl border border-surface-border bg-white transition duration-200 hover:-translate-y-1 hover:shadow-modal"
                                >
                                    <div className="flex aspect-[4/3] items-center justify-center bg-surface-subtle text-5xl">
                                        📦
                                    </div>
                                    <div className="p-6">
                                        <p className="mb-1 text-xs text-gray-500">
                                            {product.category?.name}
                                        </p>
                                        <h3 className="mb-4 line-clamp-2 font-display text-[15px] font-semibold text-prime-950">
                                            {product.name}
                                        </h3>
                                        <p className="font-display text-[15px] font-bold text-prime-950">
                                            Rp{' '}
                                            {Number(product.final_price).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ---------- Categories ---------- */}
            {categories.length > 0 && (
                <section className="bg-white py-16 md:py-20">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                        <h2 className="mb-6 font-display text-2xl font-bold text-prime-950">
                            Kategori
                        </h2>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {categories.map((cat) => (
                                <div
                                    key={cat.id}
                                    className="rounded-xl border border-surface-border bg-white p-6 text-center shadow-card"
                                >
                                    <p className="mb-2 text-4xl">{cat.icon ?? '📦'}</p>
                                    <p className="font-semibold text-prime-900">{cat.name}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ---------- About ---------- */}
            <section id="tentang" className="scroll-mt-20 bg-white py-16 md:py-24">
                <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:px-8">
                    <div className="relative mx-auto w-full max-w-md">
                        <div
                            aria-hidden
                            className="absolute -left-4 top-4 h-full w-full rounded-3xl bg-prime-100"
                        />
                        <img
                            src="/assets/logo.PNG"
                            alt="Kegiatan RTPU Politeknik Negeri Jakarta"
                            className="relative aspect-[4/4.4] w-full rounded-3xl object-cover shadow-modal"
                        />
                    </div>
                    <div>
                        <span className="mb-2 block text-sm font-semibold text-prime-600">
                            Tentang RTPU PNJ
                        </span>
                        <h2 className="mb-4 font-display text-2xl font-bold text-prime-950 sm:text-3xl">
                            Wadah resmi hilirisasi inovasi PNJ
                        </h2>
                        <p className="mb-8 text-gray-600">
                            PNJ Prime dikembangkan oleh UPA RTPU (Rekayasa Teknologi
                            &amp; Produk Unggulan) untuk mempertemukan produk,
                            layanan, dan fasilitas unggulan hasil riset kampus dengan
                            masyarakat serta industri, melalui proses pengajuan dan
                            kurasi yang jelas dan transparan.
                        </p>
                        <ul className="grid gap-6">
                            {ABOUT_POINTS.map((point) => (
                                <li key={point.title} className="flex items-start gap-3 text-sm">
                                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-prime-600 text-xs font-bold text-white">
                                        ✓
                                    </span>
                                    <span>
                                        <strong className="mb-0.5 block text-[15px] text-prime-950">
                                            {point.title}
                                        </strong>
                                        <span className="text-gray-600">{point.text}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* ---------- Footer ---------- */}
            <footer id="kontak" className="scroll-mt-20 bg-prime-950 pb-6 pt-16 text-white/70">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid gap-8 border-b border-white/10 pb-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                                    <img
                                        src="/assets/logo.PNG"
                                        alt="Logo PNJ Prime"
                                        className="h-full w-full object-contain"
                                    />
                                </span>
                                <span>
                                    <span className="block font-display text-base font-bold leading-tight text-white">
                                        PNJ Prime
                                    </span>
                                    <span className="block text-[11px] text-white/55">
                                        Politeknik Negeri Jakarta
                                    </span>
                                </span>
                            </div>
                            <p className="mt-4 max-w-xs text-sm text-white/60">
                                Platform hilirisasi dan komersialisasi produk, layanan,
                                fasilitas, dan inovasi unggulan Politeknik Negeri Jakarta.
                            </p>
                        </div>
                        <div>
                            <h4 className="mb-4 font-display text-sm font-semibold text-white">
                                Jelajahi
                            </h4>
                            <ul className="grid gap-2 text-sm">
                                <li><a href="/" className="transition hover:text-gold-400">Beranda</a></li>
                                <li><a href="#katalog" className="transition hover:text-gold-400">Katalog</a></li>
                                <li><a href="#tentang" className="transition hover:text-gold-400">Tentang Kami</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-4 font-display text-sm font-semibold text-white">
                                Akun
                            </h4>
                            <ul className="grid gap-2 text-sm">
                                {auth?.user ? (
                                    <>
                                        <li><Link href={route('dashboard')} className="transition hover:text-gold-400">Dashboard</Link></li>
                                        <li><Link href={route('profile.edit')} className="transition hover:text-gold-400">Profil</Link></li>
                                    </>
                                ) : (
                                    <>
                                        <li><Link href={route('login')} className="transition hover:text-gold-400">Masuk</Link></li>
                                        <li><Link href={route('register')} className="transition hover:text-gold-400">Daftar</Link></li>
                                    </>
                                )}
                            </ul>
                        </div>
                        <div>
                            <h4 className="mb-4 font-display text-sm font-semibold text-white">
                                Kontak
                            </h4>
                            <ul className="grid gap-2 text-sm">
                                <li><a href="mailto:rtpu@pnj.ac.id" className="transition hover:text-gold-400">rtpu@pnj.ac.id</a></li>
                                <li><a href="tel:+622112345678" className="transition hover:text-gold-400">(021) 1234 5678</a></li>
                                <li>Jl. Prof. Dr. G.A. Siwabessy, Depok</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-6 text-[13px] text-white/55">
                        <span>© 2026 PNJ Prime — UPA RTPU Politeknik Negeri Jakarta.</span>
                    </div>
                </div>
            </footer>
        </>
    );
}

import { Head, Link } from '@inertiajs/react';
import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
} from 'framer-motion';
import {
    ArrowRight,
    Building2,
    Check,
    Image as ImageIcon,
    Star,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import CatalogCard from '@/Components/Public/CatalogCard';
import PublicFooter from '@/Components/Public/PublicFooter';
import PublicHeader from '@/Components/Public/PublicHeader';
import { EASE, Reveal, StatCounter, VisualPlaceholder } from '@/Components/Public/shared';

/**
 * Set to a real photo URL to replace the hero placeholder.
 * null = show the grid-pattern placeholder with a centered icon tile.
 */
const heroImage = null;

/**
 * Static sample items for the landing mini-catalog. Backend items from the
 * `featured_products` Inertia prop are used first; these only fill the row
 * up to exactly 4 cards. No backend changes.
 */
const LANDING_SAMPLES = [
    { id: 's1', type: 'produk', title: 'Alat Uji Kualitas Air Portable', price: 'Rp 2.450.000' },
    { id: 's2', type: 'produk', title: 'Modul Trainer IoT Berbasis ESP32', price: 'Rp 1.275.000' },
    { id: 's3', type: 'jasa', title: 'Pengujian Kuat Tekan Beton', price: 'Mulai Rp 350.000' },
    { id: 's4', type: 'sewa', title: 'Ruang Rapat Lantai 2', price: 'Rp 550.000 / hari' },
];

const BENEFITS = [
    {
        title: '01 Pengajuan produk unggulan oleh Admin P3M',
        text: 'Produk unggulan hasil riset diajukan oleh Admin P3M beserta dokumen pendukungnya.',
    },
    {
        title: '02 Verifikasi oleh Pimpinan RTPU',
        text: 'Setiap pengajuan produk unggulan diverifikasi Pimpinan RTPU sebelum lanjut ke katalog.',
    },
    {
        title: '03 Layanan dikelola Admin RTPU dan diajukan Customer',
        text: 'Layanan jasa, ruangan, dan produk dikelola Admin RTPU dan dapat diajukan oleh Customer.',
    },
];

const STATS = [
    { value: 120, suffix: '+', label: 'Produk terkurasi' },
    { value: 35, suffix: '+', label: 'Inovator PNJ' },
    { value: 18, suffix: '', label: 'Mitra industri' },
];

function HeroVisual({ reduce, style }) {
    return (
        <motion.div
            className="relative order-1 mx-auto w-full max-w-md lg:order-2"
            initial={{ opacity: 0, scale: reduce ? 1 : 0.97, y: reduce ? 0 : 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.9, delay: reduce ? 0 : 0.2, ease: EASE }}
            style={style}
        >
            <div
                className="relative overflow-hidden rounded-3xl border border-white/15"
                style={{ boxShadow: '0 24px 60px -16px rgba(0,0,0,0.45)' }}
            >
                {heroImage ? (
                    <img
                        src={heroImage}
                        alt="Kegiatan dan fasilitas RTPU PNJ"
                        className="aspect-[4/4.3] w-full object-cover"
                    />
                ) : (
                    <div
                        className="relative flex aspect-[4/4.3] w-full items-center justify-center overflow-hidden"
                        style={{
                            background:
                                'linear-gradient(135deg, var(--color-deep-soft) 0%, var(--color-deep) 60%, var(--color-accent-hover) 140%)',
                        }}
                        role="img"
                        aria-label="Ilustrasi fasilitas dan inovasi RTPU PNJ"
                    >
                        <div className="grid-pattern absolute inset-0" />
                        <div
                            className="absolute -right-10 -top-10 h-44 w-44 rounded-full"
                            style={{ background: 'radial-gradient(circle, rgba(242,177,52,0.28), transparent 70%)' }}
                        />
                        <div
                            className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full"
                            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.16), transparent 70%)' }}
                        />
                        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 80px rgba(255,255,255,0.08)' }} />
                        <span
                            className="relative flex h-20 w-20 items-center justify-center rounded-3xl"
                            style={{
                                background: 'rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.22)',
                                boxShadow: '0 12px 32px -8px rgba(0,0,0,0.4)',
                            }}
                        >
                            <ImageIcon className="h-9 w-9 text-white" />
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function MiniCatalogCard({ item, index }) {
    return (
        <CatalogCard
            item={item}
            index={index}
            className="w-[240px] shrink-0 snap-start sm:w-[260px] lg:w-auto lg:shrink"
        />
    );
}

export default function CatalogIndex({ auth, categories = [], featured_products = [] }) {
    const reduce = useReducedMotion();

    // Hero parallax (desktop only, transform-only)
    const heroRef = useRef(null);
    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(min-width: 1024px)');
        const sync = () => setIsDesktop(mq.matches && !reduce);
        sync();
        mq.addEventListener('change', sync);
        return () => mq.removeEventListener('change', sync);
    }, [reduce]);
    const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
    const visualY = useTransform(scrollYProgress, [0, 1], [0, isDesktop ? 28 : 0]);

    // Backend items first (max 4), static samples fill the row up to exactly 4.
    const backendItems = (featured_products ?? []).slice(0, 4).map((p) => ({
        id: `b-${p.id}`,
        type: 'produk',
        title: p.name,
        category_name: p.category?.name,
        price: `Rp ${Number(p.final_price ?? 0).toLocaleString('id-ID')}`,
        slug: p.slug,
    }));
    const items = [...backendItems, ...LANDING_SAMPLES].slice(0, 4);

    const heroStagger = (i) => ({
        initial: { opacity: 0, y: reduce ? 0 : 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: reduce ? 0 : 0.7, delay: reduce ? 0 : i * 0.09, ease: EASE },
    });

    return (
        <>
            <Head title="PNJ Prime, Marketplace Inovasi Politeknik Negeri Jakarta" />

            {/* Header */}
            <PublicHeader auth={auth} />

            {/* Hero */}
            <section
                ref={heroRef}
                className="relative overflow-hidden text-white"
                style={{
                    background:
                        'linear-gradient(120deg, var(--color-deep) 0%, var(--color-deep-soft) 55%, var(--color-accent-hover) 125%)',
                }}
            >
                {/* Ambient glow blobs */}
                {!reduce ? (
                    <>
                        <motion.div
                            aria-hidden
                            className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full"
                            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)' }}
                            animate={{ x: [0, -24, 0], y: [0, 24, 0] }}
                            transition={{ duration: 16, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                        />
                        <motion.div
                            aria-hidden
                            className="pointer-events-none absolute -bottom-40 -left-36 h-[420px] w-[420px] rounded-full"
                            style={{ background: 'radial-gradient(circle, rgba(242,177,52,0.20), transparent 70%)' }}
                            animate={{ x: [0, 24, 0], y: [0, -24, 0] }}
                            transition={{ duration: 14, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                        />
                    </>
                ) : (
                    <>
                        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)' }} />
                        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-36 h-[420px] w-[420px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(242,177,52,0.20), transparent 70%)' }} />
                    </>
                )}

                <div className="landing-container relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="order-2 lg:order-1">
                        <motion.p {...heroStagger(0)} className="mb-4 text-sm font-semibold tracking-wide text-white/85">
                            Rekayasa Teknologi &amp; Produk Unggulan PNJ
                        </motion.p>
                        <motion.h1 {...heroStagger(1)} className="landing-h1 font-display text-white">
                            Inovasi PNJ, kini siap dipakai siapa saja
                        </motion.h1>
                        <motion.p {...heroStagger(2)} className="mt-6 max-w-xl text-[17px] leading-relaxed text-white/80">
                            PNJ Prime mempertemukan produk, jasa pengujian, dan fasilitas unggulan
                            hasil riset kampus dengan masyarakat dan industri. Produk diajukan
                            Admin P3M, dikurasi Admin RTPU, dan pembayaran masuk ke rekening
                            resmi PNJ.
                        </motion.p>
                        <motion.div {...heroStagger(3)} className="mt-8 flex flex-wrap gap-3">
                            <a
                                href="/katalog"
                                className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold text-white transition hover:-translate-y-px active:scale-[0.98]"
                                style={{ background: 'var(--color-accent)' }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                                onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
                            >
                                Jelajahi Katalog
                                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </a>
                            <a
                                href="#tentang"
                                className="group inline-flex items-center gap-2 rounded-full border bg-white px-7 py-3.5 text-[15px] font-semibold transition hover:-translate-y-px active:scale-[0.98]"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                            >
                                Tentang Kami
                                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </a>
                        </motion.div>
                        <motion.div {...heroStagger(4)} className="mt-8 flex items-center gap-3 text-sm text-white/75">
                            <span className="flex items-center gap-1.5" style={{ color: 'var(--color-gold)' }}>
                                <Star className="h-4 w-4 fill-current" />
                                <Star className="h-4 w-4 fill-current" />
                                <Star className="h-4 w-4 fill-current" />
                                <Star className="h-4 w-4 fill-current" />
                                <Star className="h-4 w-4 fill-current" />
                            </span>
                            Dipercaya 35+ inovator &amp; mitra PNJ
                        </motion.div>
                    </div>

                    {/* Hero visual, clean picture placeholder, swappable via heroImage */}
                    <HeroVisual reduce={reduce} style={isDesktop ? { y: visualY } : undefined} />
                </div>
            </section>

            {/* Mini catalog preview */}
            <section id="katalog" className="landing-section scroll-mt-20 bg-white">
                <div className="landing-container">
                    <Reveal>
                        <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                            Katalog Pilihan
                        </p>
                        <div className="max-w-xl">
                            <h2 className="font-display text-3xl font-bold sm:text-4xl" style={{ color: 'var(--color-ink)' }}>
                                Produk, jasa, dan fasilitas unggulan
                            </h2>
                            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                                Pilihan terkurasi dari riset dan fasilitas PNJ, klik
                                kartu untuk detail dan pemesanan.
                            </p>
                        </div>
                    </Reveal>

                    <div className="no-scrollbar -mx-4 mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
                        {items.map((item, i) => (
                            <MiniCatalogCard key={item.id} item={item} index={i} />
                        ))}
                    </div>

                    <Reveal className="mt-10 text-center">
                        <Link
                            href={route('catalog.index')}
                            className="group inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-[15px] font-semibold text-white transition hover:-translate-y-px active:scale-[0.98]"
                            style={{ background: 'var(--color-accent)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-accent-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--color-accent)')}
                        >
                            Lihat Semua Katalog
                            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                    </Reveal>
                </div>
            </section>

            {/* About RTPU PNJ */}
            <section id="tentang" className="landing-section scroll-mt-20" style={{ background: 'var(--color-surface)' }}>
                <div className="landing-container grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="relative mx-auto w-full max-w-md">
                        <motion.div
                            aria-hidden
                            className="absolute -left-4 top-5 h-full w-full rounded-3xl"
                            style={{ background: 'var(--color-accent-tint)' }}
                            initial={{ opacity: 0, x: reduce ? 0 : -32 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: reduce ? 0 : 0.7, ease: EASE }}
                        />
                        <motion.div
                            className="relative overflow-hidden rounded-3xl border bg-white"
                            style={{ borderColor: 'var(--color-border)' }}
                            initial={{ opacity: 0, scale: reduce ? 1 : 1.04 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: reduce ? 0 : 0.7, ease: EASE }}
                        >
                            <VisualPlaceholder icon={Building2} className="aspect-[4/4.4] w-full" />
                        </motion.div>
                    </div>

                    <div>
                        <Reveal>
                            <p className="mb-3 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                                Tentang RTPU PNJ
                            </p>
                            <h2 className="font-display text-3xl font-bold sm:text-4xl" style={{ color: 'var(--color-ink)' }}>
                                Wadah resmi hilirisasi inovasi PNJ
                            </h2>
                            <p className="mt-4 max-w-xl text-[15px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                                PNJ Prime dikembangkan oleh UPA RTPU (Rekayasa Teknologi &amp;
                                Produk Unggulan) untuk mempertemukan produk, jasa pengujian, dan
                                fasilitas hasil riset kampus dengan masyarakat serta industri.
                                Pelanggan membeli langsung sebagai Customer, dan pembayaran
                                terverifikasi masuk ke rekening resmi PNJ.
                            </p>
                        </Reveal>
                        <ul className="mt-8 space-y-5">
                            {BENEFITS.map((b, i) => (
                                <motion.li
                                    key={b.title}
                                    className="flex items-start gap-3"
                                    initial={{ opacity: 0, y: reduce ? 0 : 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : i * 0.07, ease: EASE }}
                                >
                                    <span
                                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                                        style={{ background: 'var(--color-accent)' }}
                                    >
                                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                    </span>
                                    <span>
                                        <strong className="block text-[15px] font-semibold" style={{ color: 'var(--color-ink)' }}>
                                            {b.title}
                                        </strong>
                                        <span className="text-sm leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                                            {b.text}
                                        </span>
                                    </span>
                                </motion.li>
                            ))}
                        </ul>
                        <div className="mt-10 grid grid-cols-3 gap-6 border-t pt-8" style={{ borderColor: 'var(--color-border)' }}>
                            {STATS.map((s) => (
                                <div key={s.label}>
                                    <StatCounter
                                        value={s.value}
                                        suffix={s.suffix}
                                        className="font-display text-3xl font-bold sm:text-4xl"
                                    />
                                    <p className="mt-1 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                                        {s.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <PublicFooter auth={auth} />
        </>
    );
}

import { Head, Link } from '@inertiajs/react';
import {
    motion,
    useReducedMotion,
    useScroll,
    useTransform,
} from 'framer-motion';
import { ArrowRight, Building2, Check, Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import CatalogCard, { typeFromCategory } from '@/Components/Public/CatalogCard';
import LogoMotion from '@/Components/LogoMotion';
import PublicFooter from '@/Components/Public/PublicFooter';
import PublicHeader from '@/Components/Public/PublicHeader';
import SpeedLines from '@/Components/SpeedLines';
import SwooshLine from '@/Components/SwooshLine';
import { EASE, Reveal, StatCounter, VisualPlaceholder } from '@/Components/Public/shared';

const heroImage = null;

const LANDING_SAMPLES = [
    {
        id: 's1',
        type: 'produk',
        title: 'Alat Uji Kualitas Air Portable',
        price: 'Rp 2.450.000',
        category_name: 'Peralatan',
        target_audience: 'publik',
        stock: 5,
        availability_status: 'tersedia',
        sold_count: 12,
    },
    {
        id: 's2',
        type: 'produk',
        title: 'Modul Trainer IoT Berbasis ESP32',
        price: 'Rp 1.275.000',
        category_name: 'Elektronika',
        target_audience: 'internal_pnj',
        stock: 0,
        availability_status: 'preorder',
        preorder_duration: '7 hari',
        sold_count: 8,
    },
    {
        id: 's3',
        type: 'jasa',
        title: 'Pengujian Kuat Tekan Beton',
        price: 'Mulai Rp 350.000',
        category_name: 'Jasa Laboratorium',
        target_audience: 'publik',
        availability_status: 'tersedia',
        sold_count: 21,
    },
    {
        id: 's4',
        type: 'sewa',
        title: 'Ruang Rapat Lantai 2',
        price: 'Rp 550.000 / hari',
        category_name: 'Fasilitas',
        target_audience: 'publik',
        availability_status: 'tersedia',
        sold_count: 34,
    },
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
                className="relative overflow-hidden rounded-3xl border"
                style={{ borderColor: 'var(--color-dark-border)', boxShadow: 'var(--shadow-hero)' }}
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
                            style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-gold) 28%, transparent), transparent 70%)' }}
                        />
                        <div
                            className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full"
                            style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-dark-text) 16%, transparent), transparent 70%)' }}
                        />
                        <div className="absolute inset-0" style={{ boxShadow: 'inset 0 0 80px color-mix(in srgb, var(--color-dark-text) 8%, transparent)' }} />
                        <motion.span
                            className="relative flex items-center justify-center rounded-3xl p-6"
                            style={{
                                background: 'color-mix(in srgb, var(--color-dark-text) 12%, transparent)',
                                border: '1px solid var(--color-dark-border)',
                                boxShadow: 'var(--shadow-hero)',
                            }}
                            initial={{ opacity: 0, scale: reduce ? 1 : 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.5, ease: EASE }}
                        >
                            <LogoMotion onDark height={112} showText={false} asLink={false} />
                        </motion.span>
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

    const backendItems = (featured_products ?? []).slice(0, 4).map((p) => ({
        id: `b-${p.id}`,
        type: typeFromCategory(p.category?.slug),
        title: p.name,
        category_name: p.category?.name,
        target_audience: p.target_audience ?? 'publik',
        price: `Rp ${Number(p.final_price ?? 0).toLocaleString('id-ID')}`,
        slug: p.slug,
        image: p.thumbnail ?? null,
        stock: p.stock ?? null,
        availability_status: p.meta?.availability_status ?? 'tersedia',
        preorder_duration: p.meta?.preorder_duration ?? null,
        sold_count: p.sold_count ?? 0,
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

            <PublicHeader auth={auth} />

            <section
                ref={heroRef}
                className="relative overflow-hidden text-white"
                style={{
                    background:
                        'linear-gradient(120deg, var(--color-deep) 0%, var(--color-deep-soft) 55%, var(--color-accent-hover) 125%)',
                }}
            >
                {!reduce ? (
                    <>
                        <motion.div
                            aria-hidden
                            className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full"
                            style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-dark-text) 14%, transparent), transparent 70%)' }}
                            animate={{ x: [0, -24, 0], y: [0, 24, 0] }}
                            transition={{ duration: 16, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                        />
                        <motion.div
                            aria-hidden
                            className="pointer-events-none absolute -bottom-40 -left-36 h-[420px] w-[420px] rounded-full"
                            style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-gold) 22%, transparent), transparent 70%)' }}
                            animate={{ x: [0, 24, 0], y: [0, -24, 0] }}
                            transition={{ duration: 14, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
                        />
                    </>
                ) : (
                    <>
                        <div aria-hidden className="pointer-events-none absolute -right-32 -top-32 h-[480px] w-[480px] rounded-full" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-dark-text) 14%, transparent), transparent 70%)' }} />
                        <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-36 h-[420px] w-[420px] rounded-full" style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--color-gold) 22%, transparent), transparent 70%)' }} />
                    </>
                )}

                <div className="pointer-events-none absolute -right-24 bottom-0 hidden w-[560px] opacity-20 lg:block" aria-hidden>
                    <SwooshLine size="lg" opacity={1} color="var(--color-gold)" stroke={2} />
                </div>

                <div className="landing-container relative grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
                    <div className="order-2 lg:order-1">
                        <motion.div {...heroStagger(0)} className="mb-5 flex items-center gap-3">
                            <SpeedLines size="sm" />
                            <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-semibold tracking-wide" style={{ borderColor: 'var(--color-dark-border)', background: 'color-mix(in srgb, var(--color-dark-text) 10%, transparent)', color: 'var(--color-dark-text)' }}>
                                <span className="h-2 w-2 rounded-full" style={{ background: 'var(--color-gold)' }} />
                                Rekayasa Teknologi &amp; Produk Unggulan PNJ
                            </span>
                        </motion.div>
                        <motion.h1 {...heroStagger(1)} className="landing-h1 font-display" style={{ color: 'var(--color-dark-text)' }}>
                            Inovasi PNJ, siap melaju bersama <span style={{ color: 'var(--color-gold)' }}>industri</span> &amp; masyarakat
                        </motion.h1>
                        <motion.p {...heroStagger(2)} className="mt-6 max-w-xl text-[17px] leading-relaxed" style={{ color: 'var(--color-dark-muted)' }}>
                            PNJ Prime mempertemukan produk, jasa pengujian, dan fasilitas unggulan
                            hasil riset kampus dengan masyarakat dan industri. Produk diajukan
                            Admin P3M, dikurasi Admin RTPU, dan pembayaran masuk ke rekening
                            resmi PNJ.
                        </motion.p>
                        <motion.div {...heroStagger(3)} className="mt-8 flex flex-wrap gap-3">
                            <a
                                href="/katalog"
                                className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-gold)] px-7 py-3.5 text-[15px] font-semibold text-[var(--color-deep)] transition duration-150 hover:-translate-y-px hover:bg-[var(--color-gold-deep)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-gold)] focus-visible:ring-offset-2"
                            >
                                Jelajahi Katalog
                                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </a>
                            <a
                                href="#tentang"
                                className="group inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-[15px] font-semibold transition duration-150 hover:-translate-y-px hover:bg-[var(--color-dark-hover)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dark-text)] focus-visible:ring-offset-2"
                                style={{ borderColor: 'var(--color-dark-border)', color: 'var(--color-dark-text)' }}
                            >
                                Tentang Kami
                                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                            </a>
                        </motion.div>
                        <motion.div {...heroStagger(4)} className="mt-8 flex items-center gap-3 text-sm" style={{ color: 'var(--color-dark-muted)' }}>
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

                    <HeroVisual reduce={reduce} style={isDesktop ? { y: visualY } : undefined} />
                </div>
            </section>

            <section id="katalog" className="landing-section scroll-mt-20 bg-white">
                <div className="landing-container">
                    <Reveal className="relative">
                        <div className="pointer-events-none absolute -right-8 top-0 hidden w-72 opacity-25 lg:block" aria-hidden>
                            <SwooshLine size="md" opacity={0.5} color="var(--color-accent)" stroke={1.5} />
                        </div>
                        <div className="mx-auto max-w-2xl text-center">
                            <p className="mb-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest" style={{ borderColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)', color: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent-tint) 50%, transparent)' }}>
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-gold)' }} />
                                Katalog Pilihan
                            </p>
                            <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-[44px] lg:leading-[1.08]" style={{ color: 'var(--color-ink)' }}>
                                Produk, jasa, dan fasilitas unggulan
                            </h2>
                            <div className="mx-auto mt-4 h-1 w-16 rounded-full" style={{ background: 'var(--color-gold)' }} />
                            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                                Pilihan terkurasi dari riset dan fasilitas PNJ. Klik kartu untuk
                                detail lengkap, ketersediaan, dan pemesanan.
                            </p>
                        </div>
                    </Reveal>

                    <div className="no-scrollbar -mx-4 mt-12 flex snap-x snap-mandatory gap-6 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
                        {items.map((item, i) => (
                            <MiniCatalogCard key={item.id} item={item} index={i} />
                        ))}
                    </div>

                    <Reveal className="mt-10 text-center">
                        <Link
                            href={route('catalog.index')}
                            className="group inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-8 py-3.5 text-[15px] font-semibold text-[var(--color-bg)] transition duration-150 hover:-translate-y-px hover:bg-[var(--color-accent-hover)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
                        >
                            Lihat Semua Katalog
                            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                        </Link>
                    </Reveal>
                </div>
            </section>

            <section id="tentang" className="landing-section relative scroll-mt-20 overflow-hidden" style={{ background: 'var(--color-surface)' }}>
                <div className="pointer-events-none absolute -left-24 top-10 w-[420px] opacity-30" aria-hidden>
                    <SwooshLine size="md" opacity={0.5} color="var(--color-accent)" stroke={1.5} />
                </div>
                <div className="landing-container relative grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
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
                            style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-layered)' }}
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
                            <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                                <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-gold)' }} />
                                Tentang RTPU PNJ
                            </p>
                            <h2 className="font-display text-3xl font-bold sm:text-4xl lg:text-[42px] lg:leading-[1.1]" style={{ color: 'var(--color-ink)' }}>
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

            <PublicFooter auth={auth} />
        </>
    );
}

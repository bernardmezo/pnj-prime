import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Building2, Check, ExternalLink } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { VisualPlaceholder } from '@/Components/Public/shared';
import { href as navHref } from '@/lib/nav';
import { calculateQuote } from '@/api/quote';

function typeFromSlug(slug) {
    const s = String(slug ?? '');
    if (s.includes('jasa')) return 'jasa';
    if (s.includes('sewa') || s.includes('fasilitas')) return 'ruangan';
    return 'produk';
}

function getYouTubeEmbedUrl(url) {
    if (!url) return null;
    try {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube-nocookie.com/embed/${match[2]}?autoplay=0&rel=0`;
        }
        if (url.includes('youtube.com/embed/')) return url;
        return null;
    } catch {
        return null;
    }
}

import { isStaffRole } from '@/lib/roles';

export default function CatalogShow({ auth, product, isPreview = false }) {
    const [tab, setTab] = useState('deskripsi');
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
    const [quoteData, setQuoteData] = useState(null);
    const user = auth?.user;
    const isStaff = isStaffRole(user?.role);
    const type = typeFromSlug(product.category?.slug);
    const rawPrice = Number(product.final_price ?? 0);
    const priceFormatted = `Rp ${rawPrice.toLocaleString('id-ID')}`;

    // Collect all gallery photos
    const galleryPhotos = useMemo(() => {
        const photos = [];
        const mainImage = product.thumbnail ?? product.meta?.photo ?? product.image ?? null;
        if (mainImage) photos.push(mainImage);

        if (Array.isArray(product.meta?.gallery)) {
            product.meta.gallery.forEach((img) => {
                if (img && !photos.includes(img)) photos.push(img);
            });
        }
        if (Array.isArray(product.meta?.photos)) {
            product.meta.photos.forEach((img) => {
                if (img && !photos.includes(img)) photos.push(img);
            });
        }
        if (Array.isArray(product.images)) {
            product.images.forEach((img) => {
                const src = typeof img === 'string' ? img : img?.url;
                if (src && !photos.includes(src)) photos.push(src);
            });
        }

        // If only 1 image exists, provide realistic product view variants
        if (photos.length === 1 && photos[0]) {
            photos.push(photos[0]);
            photos.push(photos[0]);
        }

        return photos;
    }, [product]);

    const activePhoto = galleryPhotos[selectedPhotoIndex] ?? galleryPhotos[0] ?? null;

    // Video URL support
    const videoRawUrl =
        product.video_url ||
        product.meta?.video_url ||
        product.meta?.youtube_url ||
        'https://www.youtube.com/watch?v=5qap5aO4i9A';

    const embedUrl = useMemo(() => getYouTubeEmbedUrl(videoRawUrl), [videoRawUrl]);

    useEffect(() => {
        if (!product?.id) return;
        let active = true;
        calculateQuote({ productId: product.id })
            .then((res) => {
                if (active && res?.success && res?.data) {
                    setQuoteData(res.data);
                }
            })
            .catch(() => {});
        return () => {
            active = false;
        };
    }, [product?.id]);

    const categoryText = product.category?.name ?? 'Katalog PNJ';
    const codeText = product.code ?? `PRD-${product.id}`;
    const ownerText = product.owner?.name ?? 'RTPU Politeknik Negeri Jakarta';

    // Pricing details
    const taxRate = quoteData?.tax?.rate_percent ?? 11;
    const taxAmount = quoteData?.tax?.tax_amount ?? Math.round(rawPrice * (taxRate / 100));
    const totalAmount = quoteData?.tax?.total ?? (rawPrice + taxAmount);

    // Specifications
    const specList =
        type === 'jasa'
            ? [
                ['Metode Pengujian', product.meta?.method ?? 'Acuan SNI / ASTM'],
                ['Estimasi Waktu', product.meta?.duration ?? '3–5 hari kerja'],
                ['Lokasi', product.meta?.location ?? 'Lab Terpadu PNJ Depok'],
                ['Keluaran', 'Laporan Hasil Uji (LHU) resmi'],
            ]
            : type === 'ruangan'
              ? [
                ['Kapasitas', product.meta?.capacity ? `${product.meta.capacity} orang` : 'Maksimal 120 orang'],
                ['Lokasi', product.meta?.location ?? 'Kampus PNJ Depok'],
                ['Fasilitas', product.meta?.facilities ?? 'AC, Audio system, Proyektor HDMI'],
                ['Durasi Pemakaian', 'Per sesi (4 jam) atau harian (8 jam)'],
            ]
              : [
                ['Status Riset', product.meta?.tkt ? `TKT Level ${product.meta.tkt}` : 'Siap diproduksi / dikembangkan'],
                ['Paten / HKI', product.meta?.patent ?? 'Terdaftar Sivitas PNJ'],
                ['Ketersediaan', product.stock ? `${product.stock} unit` : 'Sesuai pesanan'],
                ['Garansi', 'Garansi fungsional 30 hari'],
            ];

    return (
        <PublicLayout auth={auth}>
            <Head title={`${product.name} · PNJ Prime`} />

            <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
                {/* Preview note for unapproved/inactive products viewable by admins */}
                {isPreview && (
                    <div className="mb-4 text-xs text-slate-500">
                        Pratinjau: belum tampil di katalog publik.
                    </div>
                )}

                {/* 1. Breadcrumb (small, plain text) */}
                <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500" aria-label="Breadcrumb">
                    <Link href={route('home')} className="hover:text-slate-900 transition-colors">
                        Beranda
                    </Link>
                    <span>/</span>
                    <Link href={route('catalog.index')} className="hover:text-slate-900 transition-colors">
                        Katalog
                    </Link>
                    <span>/</span>
                    <span className="truncate max-w-[200px] sm:max-w-xs text-slate-700">
                        {product.name}
                    </span>
                </nav>

                {/* 2-Column Responsive Layout */}
                <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 items-start">
                    {/* Left Column (7 cols): Photo Gallery & Video */}
                    <div className="lg:col-span-7 space-y-5">
                        {/* ── Photo Gallery ── */}
                        <div>
                            {/* Big Photo */}
                            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                <div className="aspect-[4/3] w-full">
                                    <VisualPlaceholder
                                        icon={Building2}
                                        image={activePhoto}
                                        alt={`${product.name} foto ${selectedPhotoIndex + 1}`}
                                        className="h-full w-full object-cover transition-all duration-200"
                                    />
                                </div>
                            </div>

                            {/* Small Photos Line Up Below */}
                            {galleryPhotos.length > 1 && (
                                <div className="mt-2.5 flex items-center gap-2 overflow-x-auto pb-1">
                                    {galleryPhotos.map((img, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedPhotoIndex(idx)}
                                            className={`relative h-14 w-18 shrink-0 overflow-hidden rounded border transition-all ${
                                                selectedPhotoIndex === idx
                                                    ? 'border-slate-900 ring-1 ring-slate-900 opacity-100'
                                                    : 'border-slate-200 opacity-60 hover:opacity-100'
                                            }`}
                                        >
                                            <VisualPlaceholder
                                                icon={Building2}
                                                image={img}
                                                alt={`Thumbnail ${idx + 1}`}
                                                className="h-full w-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* ── Video Player ── */}
                        {embedUrl && (
                            <div className="pt-3 border-t border-slate-100">
                                <div className="mb-2 flex items-center justify-between text-xs">
                                    <span className="font-semibold text-slate-800">
                                        Video Demo Produk
                                    </span>
                                    <a
                                        href={videoRawUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 hover:underline"
                                    >
                                        <span>Buka di YouTube</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>

                                <div className="overflow-hidden rounded-lg border border-slate-200 bg-black aspect-[16/9] w-full">
                                    <iframe
                                        className="h-full w-full"
                                        src={embedUrl}
                                        title={`Video demo ${product.name}`}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column (5 cols): Sticky Buy Box + In-depth Information Tabs */}
                    <div className="lg:col-span-5 flex flex-col space-y-6 lg:sticky lg:top-24">
                        {/* ── Main Purchasing Block ── */}
                        <div className="border border-slate-200 rounded-lg p-5 sm:p-6 bg-white">
                            {/* Category & Code */}
                            <div className="text-xs text-slate-500">
                                <span>{categoryText}</span>
                                <span className="mx-1.5 text-slate-300">/</span>
                                <span>{codeText}</span>
                            </div>

                            {/* Unpublished preview banner */}
                            {(isPreview || product.is_active === false || product.status === 'Draft' || product.status === 'Diajukan') && (
                                <p className="mt-1.5 text-xs text-amber-700 font-medium">
                                    Pratinjau: belum tampil di katalog publik.
                                </p>
                            )}

                            {/* Product Title */}
                            <h1 className="mt-1.5 font-display text-xl font-bold tracking-tight text-slate-900 sm:text-2xl leading-snug">
                                {product.name}
                            </h1>

                            {/* Managed by */}
                            <div className="mt-1 text-xs text-slate-500">
                                Dikelola oleh {ownerText}
                            </div>

                            {/* Short Description */}
                            <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">
                                {product.short_description || 'Layanan dan produk riset terapan resmi dari sivitas akademika Politeknik Negeri Jakarta.'}
                            </p>

                            {/* Price display */}
                            <div className="mt-4 pt-3 border-t border-slate-100">
                                <div className="font-display text-2xl font-bold text-slate-900">
                                    {priceFormatted}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                    Belum termasuk PPN {taxRate}% (Total: Rp {totalAmount.toLocaleString('id-ID')})
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-5 space-y-2.5">
                                {isStaff ? (
                                    <Link
                                        href={route('rtpu.layanan')}
                                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-[6px] border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                                    >
                                        <span>Kelola layanan ini</span>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                ) : user ? (
                                    <a
                                        href={navHref('customer.pengajuan.create', { product_id: product.id, tipe: type }, user.role)}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-2.5 text-xs font-semibold text-white bg-[var(--color-accent)] hover:opacity-90 active:scale-[0.99] transition"
                                    >
                                        <span>Ajukan Layanan</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                ) : (
                                    <Link
                                        href={route('login')}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-md px-5 py-2.5 text-xs font-semibold text-white bg-[var(--color-accent)] hover:opacity-90 active:scale-[0.99] transition"
                                    >
                                        <span>Masuk untuk Mengajukan</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                )}

                                <div className="text-xs pt-1">
                                    <Link
                                        href={route('catalog.index')}
                                        className="text-slate-500 hover:text-slate-900 hover:underline transition"
                                    >
                                        ← Kembali ke katalog
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* ── Tabs (Now positioned directly under the buy box to balance height) ── */}
                        <div className="border border-slate-200 rounded-lg p-5 bg-white">
                            {/* Plain text tab header */}
                            <div className="flex gap-5 border-b border-slate-200" role="tablist">
                                {[
                                    ['deskripsi', 'Deskripsi'],
                                    ['spesifikasi', 'Spesifikasi'],
                                    ['prosedur', 'Prosedur & Biaya'],
                                ].map(([key, label]) => (
                                    <button
                                        key={key}
                                        type="button"
                                        role="tab"
                                        aria-selected={tab === key}
                                        onClick={() => setTab(key)}
                                        className={`pb-2.5 text-xs transition-colors relative ${
                                            tab === key
                                                ? 'font-bold text-[var(--color-accent)]'
                                                : 'font-medium text-slate-500 hover:text-slate-900'
                                        }`}
                                    >
                                        {label}
                                        {tab === key && (
                                            <span className="absolute inset-x-0 -bottom-px h-[2px] bg-[var(--color-accent)]" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="mt-4 text-xs text-slate-700 leading-relaxed">
                                {tab === 'deskripsi' && (
                                    <div className="space-y-3">
                                        <p>
                                            {product.description || product.short_description || 'Deskripsi lengkap belum diunggah.'}
                                        </p>
                                        <p className="text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                                            Untuk spesifikasi kebutuhan khusus atau Kerangka Acuan Kerja (KAK), Anda dapat melampirkan berkas pada saat pengajuan.
                                        </p>
                                    </div>
                                )}

                                {tab === 'spesifikasi' && (
                                    <dl className="space-y-2">
                                        {specList.map(([key, val]) => (
                                            <div key={key} className="flex justify-between py-1 border-b border-slate-100">
                                                <dt className="text-slate-500">{key}</dt>
                                                <dd className="font-semibold text-slate-800 text-right">{val}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                )}

                                {tab === 'prosedur' && (
                                    <div className="space-y-3.5">
                                        <div>
                                            <h4 className="font-bold text-slate-900 mb-1.5">Rincian Biaya</h4>
                                            <div className="space-y-1 text-slate-600">
                                                <div className="flex justify-between py-0.5 border-b border-slate-100">
                                                    <span>Tarif Dasar</span>
                                                    <span className="font-mono text-slate-800">{priceFormatted}</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-slate-100">
                                                    <span>PPN ({taxRate}%)</span>
                                                    <span className="font-mono text-slate-800">Rp {taxAmount.toLocaleString('id-ID')}</span>
                                                </div>
                                                <div className="flex justify-between py-1 font-bold text-slate-900">
                                                    <span>Total Pembayaran</span>
                                                    <span className="font-mono">Rp {totalAmount.toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-1 border-t border-slate-100">
                                            <h4 className="font-bold text-slate-900 mb-1">Alur Singkat</h4>
                                            <ol className="list-decimal pl-3.5 space-y-1 text-slate-600">
                                                <li>Isi formulir pengajuan online.</li>
                                                <li>Admin RTPU menerbitkan penawaran biaya.</li>
                                                <li>Pembayaran via Virtual Account BLU PNJ.</li>
                                                <li>Pelaksanaan & Berita Acara Serah Terima (BAST).</li>
                                            </ol>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Sticky Bottom Bar */}
                <div className="fixed inset-x-0 bottom-0 z-40 block md:hidden border-t border-slate-200 bg-white p-3 shadow-md">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-[10px] text-slate-500">Tarif Layanan</div>
                            <div className="font-display text-base font-bold text-slate-900">
                                {priceFormatted}
                            </div>
                        </div>
                        {user ? (
                            <a
                                href={navHref('customer.pengajuan.create', { product_id: product.id, tipe: type }, user.role)}
                                className="inline-flex items-center gap-1.5 rounded-[6px] px-4 py-2 text-xs font-semibold text-white bg-[var(--color-accent)]"
                            >
                                <span>Ajukan</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                        ) : (
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-1.5 rounded-[6px] px-4 py-2 text-xs font-semibold text-white bg-[var(--color-accent)]"
                            >
                                <span>Masuk & Ajukan</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </PublicLayout>
    );
}

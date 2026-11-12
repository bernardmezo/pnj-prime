import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Building2, Check, ChevronLeft, ChevronRight, ExternalLink, X, ZoomIn } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PublicLayout from '@/Layouts/PublicLayout';
import { VisualPlaceholder } from '@/Components/Public/shared';
import { href as navHref } from '@/lib/nav';
import { calculateQuote } from '@/api/quote';
import { resolveImageUrl } from '@/Components/Public/CatalogCard';

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
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [quoteData, setQuoteData] = useState(null);
    const user = auth?.user;
    const isStaff = isStaffRole(user?.role);
    const type = typeFromSlug(product.category?.slug);
    const rawPrice = Number(product.final_price ?? 0);
    const priceFormatted = `Rp ${rawPrice.toLocaleString('id-ID')}`;

    // Collect all gallery photos
    const galleryPhotos = useMemo(() => {
        const photos = [];
        const mainImage = resolveImageUrl(product.thumbnail ?? product.meta?.photo ?? product.image ?? null);
        if (mainImage) photos.push(mainImage);

        if (Array.isArray(product.meta?.gallery)) {
            product.meta.gallery.forEach((img) => {
                const resolved = resolveImageUrl(img);
                if (resolved && !photos.includes(resolved)) photos.push(resolved);
            });
        }
        if (Array.isArray(product.meta?.photos)) {
            product.meta.photos.forEach((img) => {
                const resolved = resolveImageUrl(img);
                if (resolved && !photos.includes(resolved)) photos.push(resolved);
            });
        }
        if (Array.isArray(product.images)) {
            product.images.forEach((img) => {
                const src = typeof img === 'string' ? img : img?.url;
                const resolved = resolveImageUrl(src);
                if (resolved && !photos.includes(resolved)) photos.push(resolved);
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

    // Video URL support (only if explicitly provided)
    const videoRawUrl =
        product.video_url ||
        product.meta?.video_url ||
        product.meta?.youtube_url ||
        null;

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
    const ownerName = product.owner?.name;
    const ownerDept = product.owner?.jurusan || product.owner?.unit_name;
    const ownerText = ownerDept ? `${ownerName ? ownerName + ' (' + ownerDept + ')' : ownerDept}` : (ownerName ?? 'RTPU Politeknik Negeri Jakarta');

    // Pricing details
    const taxRate = quoteData?.tax?.rate_percent ?? 11;
    const taxAmount = quoteData?.tax?.tax_amount ?? Math.round(rawPrice * (taxRate / 100));
    const totalAmount = quoteData?.tax?.total ?? (rawPrice + taxAmount);

    const availabilityLabel = product.meta?.availability_status === 'preorder'
        ? `Pre-Order (Estimasi ${product.meta?.preorder_duration || '14 hari'})`
        : 'Ready Stock';

    const weightVal = product.meta?.weight || product.weight;
    const lengthVal = product.meta?.length || product.length;
    const widthVal = product.meta?.width || product.width;
    const heightVal = product.meta?.height || product.height;

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
                ['Ketersediaan', availabilityLabel],
                ...(weightVal ? [['Berat', `${weightVal} gram`]] : []),
                ...(lengthVal && widthVal && heightVal ? [['Dimensi', `${lengthVal} x ${widthVal} x ${heightVal} cm`]] : []),
                ['Status Riset', product.meta?.tkt ? `TKT Level ${product.meta.tkt}` : 'Siap diproduksi / dikembangkan'],
                ['Paten / HKI', product.meta?.patent ?? 'Terdaftar Sivitas PNJ'],
                ['Garansi', 'Garansi fungsional 30 hari'],
            ];

    return (
        <PublicLayout auth={auth}>
            <Head title={`${product.name} · PNJ Prime`} />

            <div className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
                {/* Preview note for unapproved/inactive products viewable by admins */}
                {isPreview && (
                    <div className="mb-4 text-xs text-[var(--color-muted)]">
                        Pratinjau: belum tampil di katalog publik.
                    </div>
                )}

                {/* 1. Breadcrumb & Back button */}
                <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                    <nav className="flex items-center gap-2 text-xs text-[var(--color-muted)]" aria-label="Breadcrumb">
                        <Link href={route('home')} className="hover:text-[var(--color-ink)] transition-colors">
                            Beranda
                        </Link>
                        <span>/</span>
                        <Link href={route('catalog.index')} className="hover:text-[var(--color-ink)] transition-colors">
                            Katalog
                        </Link>
                        <span>/</span>
                        <span className="truncate max-w-[200px] sm:max-w-xs text-[var(--color-ink)]">
                            {product.name}
                        </span>
                    </nav>

                    <Link
                        href={route('catalog.index')}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-tint)]"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Kembali ke Katalog
                    </Link>
                </div>

                {/* 2-Column Responsive Layout */}
                <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 items-start">
                    {/* Left Column (7 cols): Photo Gallery & Video */}
                    <div className="lg:col-span-7 space-y-5">
                        {/* ── Photo Gallery ── */}
                        <div>
                            {/* Big Photo */}
                            <div 
                                onClick={() => setIsLightboxOpen(true)}
                                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-card"
                                title="Klik untuk perbesar foto (Lightbox)"
                            >
                                <div className="aspect-[4/3] w-full">
                                    <VisualPlaceholder
                                        icon={Building2}
                                        image={activePhoto}
                                        alt={`${product.name} foto ${selectedPhotoIndex + 1}`}
                                        className="h-full w-full object-cover transition-all duration-200 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                                        <ZoomIn className="w-6 h-6" />
                                    </div>
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
                                                    ? 'border-[var(--color-ink)] ring-1 ring-[var(--color-ink)] opacity-100'
                                                    : 'border-[var(--color-border)] opacity-60 hover:opacity-100'
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

                        {/* ── Uploaded Video Player ── */}
                        {product.video_path && (
                            <div className="pt-3 border-t border-[var(--color-border)]">
                                <div className="mb-2 text-xs font-semibold text-[var(--color-ink)]">
                                    Video Demo Produk
                                </div>
                                <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-black aspect-[16/9] w-full">
                                    <video
                                        controls
                                        className="h-full w-full object-contain"
                                        src={`/storage/${product.video_path}`}
                                    >
                                        Browser Anda tidak mendukung tag video.
                                    </video>
                                </div>
                            </div>
                        )}

                        {/* ── Video Player ── */}
                        {videoRawUrl && (
                            <div className="pt-3 border-t border-[var(--color-border)]">
                                <div className="mb-2 flex items-center justify-between text-xs">
                                    <span className="font-semibold text-[var(--color-ink)]">
                                        Tautan Video Promosi / Demo
                                    </span>
                                    <a
                                        id="youtube-link"
                                        href={videoRawUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-semibold hover:underline"
                                    >
                                        <span>Buka di YouTube</span>
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                </div>

                                {embedUrl && (
                                    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-black aspect-[16/9] w-full">
                                        <iframe
                                            className="h-full w-full"
                                            src={embedUrl}
                                            title={`Video demo ${product.name}`}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column (5 cols): Sticky Buy Box + In-depth Information Tabs */}
                    <div className="lg:col-span-5 flex flex-col space-y-6 lg:sticky lg:top-24">
                        {/* ── Main Purchasing Block ── */}
                        <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-card p-5 sm:p-6">
                            {/* Category & Code */}
                            <div className="text-xs text-[var(--color-muted)]">
                                <span>{categoryText}</span>
                                <span className="mx-1.5 text-[var(--color-border)]">/</span>
                                <span>{codeText}</span>
                            </div>

                            {/* Unpublished preview banner */}
                            {(isPreview || product.is_active === false || product.status === 'Draft' || product.status === 'Diajukan') && (
                                <p className="mt-1.5 text-xs text-amber-700 font-medium">
                                    Pratinjau: belum tampil di katalog publik.
                                </p>
                            )}

                            {/* Product Title */}
                            <h1 className="mt-1.5 font-display text-xl font-bold tracking-tight text-[var(--color-ink)] sm:text-2xl leading-snug">
                                {product.name}
                            </h1>

                            {/* Managed by */}
                            <div className="mt-1 text-xs text-[var(--color-muted)]">
                                Dikelola oleh {ownerText}
                            </div>

                            {/* Short Description */}
                            <p className="mt-2.5 text-xs text-[var(--color-muted)] leading-relaxed">
                                {product.short_description || 'Layanan dan produk riset terapan resmi dari sivitas akademika Politeknik Negeri Jakarta.'}
                            </p>

                            {/* Ketersediaan, Berat, Dimensi badges */}
                            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                                {product.target_audience === 'internal_pnj' ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1" style={{ background: 'color-mix(in srgb, var(--color-gold) 12%, transparent)', borderColor: 'color-mix(in srgb, var(--color-gold) 35%, transparent)', color: 'var(--color-gold-deep)' }}>
                                        🔒 Khusus Sivitas PNJ
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-accent-tint)] bg-[var(--color-accent-tint)] px-2.5 py-1 text-[var(--color-accent-hover)]">
                                        🌐 Terbuka untuk Umum
                                    </span>
                                )}
                                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 ${product.meta?.availability_status === 'preorder' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-teal-50 text-teal-700 border-teal-100'}`}>
                                    {availabilityLabel}
                                </span>
                                {weightVal && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-ink)]">
                                        Berat: {weightVal} gram
                                    </span>
                                )}
                                {lengthVal && widthVal && heightVal && (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[var(--color-ink)]">
                                        Dimensi: {lengthVal} x {widthVal} x {heightVal} cm
                                    </span>
                                )}
                            </div>

                            {/* Price display */}
                            <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
                                <div className="font-display text-2xl font-bold text-[var(--color-ink)]">
                                    {priceFormatted}
                                </div>
                                <div className="text-[11px] text-[var(--color-muted)] mt-0.5">
                                    Belum termasuk PPN {taxRate}% (Total: Rp {totalAmount.toLocaleString('id-ID')})
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="mt-5 space-y-2.5">
                                {isStaff ? (
                                    <Link
                                        href={route('rtpu.layanan')}
                                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-xs font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-tint)]"
                                    >
                                        <span>Kelola layanan ini</span>
                                        <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                ) : user ? (
                                    <a
                                        href={navHref('customer.pengajuan.create', { product_id: product.id, tipe: type }, user.role)}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-bg)] transition hover:bg-[var(--color-accent-hover)] active:scale-[0.99]"
                                    >
                                        <span>Ajukan Layanan</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                ) : (
                                    <Link
                                        href={route('login')}
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[var(--color-bg)] transition hover:bg-[var(--color-accent-hover)] active:scale-[0.99]"
                                    >
                                        <span>Masuk untuk Mengajukan</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                )}

                                <div className="text-xs pt-1">
                                    <Link
                                        href={route('catalog.index')}
                                        className="text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:underline transition"
                                    >
                                        ← Kembali ke katalog
                                    </Link>
                                </div>
                            </div>
                        </div>

                        {/* ── Tabs (Now positioned directly under the buy box to balance height) ── */}
                        <div className="rounded-2xl border border-[var(--color-border)] bg-white shadow-card p-5">
                            {/* Plain text tab header */}
                            <div className="flex gap-5 border-b border-[var(--color-border)]" role="tablist">
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
                                                : 'font-medium text-[var(--color-muted)] hover:text-[var(--color-ink)]'
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
                            <div className="mt-4 text-xs text-[var(--color-ink)] leading-relaxed">
                                {tab === 'deskripsi' && (
                                    <div className="space-y-3">
                                        <p>
                                            {product.description || product.short_description || 'Deskripsi lengkap belum diunggah.'}
                                        </p>
                                        <p className="text-[11px] text-[var(--color-muted)] border-t border-[var(--color-border)] pt-2.5">
                                            Untuk spesifikasi kebutuhan khusus atau Kerangka Acuan Kerja (KAK), Anda dapat melampirkan berkas pada saat pengajuan.
                                        </p>
                                    </div>
                                )}

                                {tab === 'spesifikasi' && (
                                    <dl className="space-y-2">
                                        {specList.map(([key, val]) => (
                                            <div key={key} className="flex justify-between py-1 border-b border-[var(--color-border)]">
                                                <dt className="text-[var(--color-muted)]">{key}</dt>
                                                <dd className="font-semibold text-[var(--color-ink)] text-right">{val}</dd>
                                            </div>
                                        ))}
                                    </dl>
                                )}

                                {tab === 'prosedur' && (
                                    <div className="space-y-3.5">
                                        <div>
                                            <h4 className="font-bold text-[var(--color-ink)] mb-1.5">Rincian Biaya</h4>
                                            <div className="space-y-1 text-[var(--color-muted)]">
                                                <div className="flex justify-between py-0.5 border-b border-[var(--color-border)]">
                                                    <span>Tarif Dasar</span>
                                                    <span className="font-mono text-[var(--color-ink)]">{priceFormatted}</span>
                                                </div>
                                                <div className="flex justify-between py-0.5 border-b border-[var(--color-border)]">
                                                    <span>PPN ({taxRate}%)</span>
                                                    <span className="font-mono text-[var(--color-ink)]">Rp {taxAmount.toLocaleString('id-ID')}</span>
                                                </div>
                                                <div className="flex justify-between py-1 font-bold text-[var(--color-ink)]">
                                                    <span>Total Pembayaran</span>
                                                    <span className="font-mono">Rp {totalAmount.toLocaleString('id-ID')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-1 border-t border-[var(--color-border)]">
                                            <h4 className="font-bold text-[var(--color-ink)] mb-1">Alur Singkat</h4>
                                            <ol className="list-decimal pl-3.5 space-y-1 text-[var(--color-muted)]">
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
                <div className="fixed inset-x-0 bottom-0 z-40 block md:hidden border-t border-[var(--color-border)] bg-white p-3 shadow-md">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <div className="text-[10px] text-[var(--color-muted)]">Tarif Layanan</div>
                            <div className="font-display text-base font-bold text-[var(--color-ink)]">
                                {priceFormatted}
                            </div>
                        </div>
                        {user ? (
                            <a
                                href={navHref('customer.pengajuan.create', { product_id: product.id, tipe: type }, user.role)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-4 py-2.5 text-xs font-semibold text-[var(--color-bg)] transition hover:bg-[var(--color-accent-hover)]"
                            >
                                <span>Ajukan</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </a>
                        ) : (
                            <Link
                                href={route('login')}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-4 py-2.5 text-xs font-semibold text-[var(--color-bg)] transition hover:bg-[var(--color-accent-hover)]"
                            >
                                <span>Masuk & Ajukan</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && activePhoto && (
                <div 
                    id="lightbox-backdrop"
                    onClick={() => setIsLightboxOpen(false)}
                    className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4"
                >
                    <div 
                        onClick={(e) => e.stopPropagation()}
                        className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
                    >
                        <VisualPlaceholder
                            id="lightbox-image"
                            icon={Building2}
                            image={activePhoto}
                            alt={`${product.name} foto ${selectedPhotoIndex + 1}`}
                            className="max-h-[80vh] max-w-full rounded-xl shadow-2xl object-contain"
                        />
                        
                        {/* Photo counter */}
                        <div id="lightbox-counter" className="mt-3 text-white text-xs font-semibold px-3 py-1 rounded-full bg-black/50">
                            Foto {selectedPhotoIndex + 1} dari {galleryPhotos.length}
                        </div>

                        {/* Navigation Buttons */}
                        {galleryPhotos.length > 1 && (
                            <>
                                <button
                                    id="lightbox-prev"
                                    type="button"
                                    aria-label="Foto Sebelumnya"
                                    onClick={() => setSelectedPhotoIndex((selectedPhotoIndex - 1 + galleryPhotos.length) % galleryPhotos.length)}
                                    className="absolute -left-12 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[var(--color-ink)] rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg transition"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    id="lightbox-next"
                                    type="button"
                                    aria-label="Foto Selanjutnya"
                                    onClick={() => setSelectedPhotoIndex((selectedPhotoIndex + 1) % galleryPhotos.length)}
                                    className="absolute -right-12 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-[var(--color-ink)] rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg transition"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </>
                        )}

                        {/* Close button */}
                        <button
                            id="lightbox-close"
                            type="button"
                            aria-label="Tutup Lightbox"
                            onClick={() => setIsLightboxOpen(false)}
                            className="absolute -top-4 -right-4 bg-white text-[var(--color-ink)] rounded-full w-9 h-9 flex items-center justify-center font-bold shadow-lg hover:bg-[var(--color-surface)] transition"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
        </PublicLayout>
    );
}

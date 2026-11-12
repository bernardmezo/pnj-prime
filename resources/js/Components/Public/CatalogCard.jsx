import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowRight,
    Building2,
    Check,
    Clock,
    FlaskConical,
    Globe,
    Lock,
    Package,
    PackageX,
} from 'lucide-react';
import { EASE } from '@/Components/ui';

export const TYPE_META = {
    produk: { label: 'Produk', icon: Package },
    jasa: { label: 'Jasa', icon: FlaskConical },
    sewa: { label: 'Fasilitas', icon: Building2 },
};

export function typeFromCategory(slug) {
    const s = String(slug ?? '');
    if (s.includes('jasa')) return 'jasa';
    if (s.includes('sewa') || s.includes('fasilitas')) return 'sewa';
    return 'produk';
}

export function formatRp(value) {
    return `Rp ${Number(value ?? 0).toLocaleString('id-ID')}`;
}

export function resolveImageUrl(path) {
    if (!path || typeof path !== 'string') return null;
    const trimmed = path.trim();
    if (!trimmed) return null;
    if (
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('blob:') ||
        trimmed.startsWith('data:')
    ) {
        return trimmed;
    }
    if (trimmed.startsWith('/')) {
        return trimmed;
    }
    if (trimmed.startsWith('storage/')) {
        return `/${trimmed}`;
    }
    return `/storage/${trimmed}`;
}

const AUDIENCE_META = {
    internal_pnj: {
        label: 'Internal PNJ',
        icon: Lock,
        className: 'border-transparent',
        style: {
            background: 'color-mix(in srgb, var(--color-gold) 14%, transparent)',
            borderColor: 'color-mix(in srgb, var(--color-gold) 40%, transparent)',
            color: 'var(--color-gold-deep)',
        },
    },
    publik: {
        label: 'Publik',
        icon: Globe,
        className: 'bg-slate-100 text-slate-600 border-slate-200',
    },
};

function stockMeta(item) {
    const status = item.availability_status ?? 'tersedia';
    const stock = item.stock;

    if (status === 'preorder') {
        return {
            label: 'Pre-order',
            detail: item.preorder_duration,
            icon: Clock,
            className: 'bg-amber-100 text-amber-700 border-amber-200',
        };
    }

    if (stock === null || stock === undefined) {
        return {
            label: 'Tersedia',
            icon: Check,
            className: 'bg-teal-50 text-teal-700 border-teal-100',
        };
    }

    if (stock > 0) {
        return {
            label: 'Ready Stock',
            detail: `${stock} unit`,
            icon: Check,
            className: 'bg-teal-50 text-teal-700 border-teal-100',
        };
    }

    return {
        label: 'Stok Habis',
        icon: PackageX,
        className: 'bg-rose-50 text-rose-700 border-rose-100',
    };
}

export default function CatalogCard({ item, index = 0, className = '' }) {
    const reduce = useReducedMotion();
    const meta = TYPE_META[item.type] ?? TYPE_META.produk;
    const TypeIcon = meta.icon;
    const isLink = Boolean(item.slug);
    const Wrapper = isLink ? Link : 'div';
    const wrapperProps = isLink ? { href: route('catalog.show', item.slug) } : {};
    const imageSrc = resolveImageUrl(item.image ?? item.thumbnail ?? item.thumbnail_url ?? null);

    const audience = AUDIENCE_META[item.target_audience ?? 'publik'] ?? AUDIENCE_META.publik;
    const AudienceIcon = audience.icon;
    const stock = stockMeta(item);
    const StockIcon = stock.icon;

    const soldCount = Number.isFinite(Number(item.sold_count)) ? Number(item.sold_count) : 0;
    const soldLabel = soldCount > 0 ? `Terjual ${soldCount}` : 'Belum terjual';

    return (
        <motion.div
            initial={{ opacity: 0, y: reduce ? 0 : 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: reduce ? 0 : 0.6, delay: reduce ? 0 : index * 0.07, ease: EASE }}
            className={className}
        >
            <Wrapper
                {...wrapperProps}
                className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-card transition-all duration-200 hover:-translate-y-1.5 hover:border-[var(--color-accent)] hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
                <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 z-10 h-[3px] scale-x-0 bg-gradient-to-r from-[var(--color-gradient-start)] via-[var(--color-gradient-end)] to-[var(--color-gradient-start)] transition-transform duration-300 group-hover:scale-x-100"
                />

                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-bg)]">
                    <div
                        className="absolute inset-0 flex items-center justify-center transition-transform duration-500 group-hover:scale-105"
                        style={{ background: 'linear-gradient(135deg, var(--color-accent-tint) 0%, var(--color-bg) 60%, var(--color-accent-tint) 130%)' }}
                    >
                        <div className="dot-pattern-dark absolute inset-0 opacity-60" />
                        <span
                            className="relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-white shadow-sm"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-accent)' }}
                        >
                            <TypeIcon className="h-6 w-6" />
                        </span>
                    </div>
                    {imageSrc && (
                        <img
                            src={imageSrc}
                            alt={item.title || ''}
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            className="catalog-card-img absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    )}

                    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/30 to-transparent p-3">
                        <div className="flex items-start justify-between gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border bg-white/95 px-2 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-sm" style={{ color: 'var(--color-ink)' }}>
                                <TypeIcon className="h-3 w-3" style={{ color: 'var(--color-accent)' }} />
                                {meta.label}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold shadow-sm backdrop-blur-sm ${audience.className}`}
                                style={audience.style}
                            >
                                <AudienceIcon className="h-3 w-3" />
                                {audience.label}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-1 flex-col p-5">
                    <div className="mb-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${stock.className}`}>
                            <StockIcon className="h-3 w-3" />
                            {stock.label}
                            {stock.detail ? <span className="opacity-80">· {stock.detail}</span> : null}
                        </span>
                    </div>

                    <h3
                        className="mb-2 line-clamp-2 font-display text-[17px] font-bold leading-snug tracking-tight transition-colors duration-150 group-hover:text-[var(--color-accent)]"
                        style={{ color: 'var(--color-ink)' }}
                    >
                        {item.title}
                    </h3>

                    <p className="mb-4 text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                        {item.category_name ?? meta.label}
                        <span className="mx-1.5 opacity-40">·</span>
                        {soldLabel}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t pt-3.5" style={{ borderColor: 'var(--color-border)' }}>
                        <p className="font-display text-[16px] font-bold" style={{ color: 'var(--color-ink)' }}>
                            {item.price}
                        </p>
                        <span
                            className="flex h-8 w-8 -translate-x-2 items-center justify-center rounded-full text-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                            style={{ background: 'var(--color-gold)', color: 'var(--color-deep)' }}
                            aria-hidden
                        >
                            <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                    </div>
                </div>
            </Wrapper>
        </motion.div>
    );
}

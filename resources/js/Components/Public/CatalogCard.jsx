import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Building2, FlaskConical, Package } from 'lucide-react';
import { EASE } from '@/Components/ui';

export const TYPE_META = {
    produk: { label: 'Produk', icon: Package },
    jasa: { label: 'Jasa', icon: FlaskConical },
    sewa: { label: 'Fasilitas', icon: Building2 },
};

/** Map a backend category slug to a card type. */
export function typeFromCategory(slug) {
    const s = String(slug ?? '');
    if (s.includes('jasa')) return 'jasa';
    if (s.includes('sewa') || s.includes('fasilitas')) return 'sewa';
    return 'produk';
}

export function formatRp(value) {
    return `Rp ${Number(value ?? 0).toLocaleString('id-ID')}`;
}

/**
 * Resolve relative or storage-backed product image path to a working public URL.
 */
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

/**
 * Catalog card, single design used by the landing preview and the full
 * catalog page: image placeholder area, small type label, title, price.
 * Hover lift + image zoom; scroll-reveal stagger (index * 70ms).
 */
export default function CatalogCard({ item, index = 0, className = '' }) {
    const reduce = useReducedMotion();
    const meta = TYPE_META[item.type] ?? TYPE_META.produk;
    const TypeIcon = meta.icon;
    const isLink = Boolean(item.slug);
    const Wrapper = isLink ? Link : 'div';
    const wrapperProps = isLink ? { href: route('catalog.show', item.slug) } : {};
    const imageSrc = resolveImageUrl(item.image ?? item.thumbnail ?? item.thumbnail_url ?? null);

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
                className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover hover:border-[var(--color-accent)]"
                style={{ borderColor: 'var(--color-border)' }}
            >
                {/* Speed-line accent top indicator inspired by Prime logo */}
                <div
                    aria-hidden
                    className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-gold)] to-[var(--color-accent)] opacity-0 transition-opacity duration-300 group-hover:opacity-100 z-10"
                />

                <div className="relative aspect-[4/3] w-full overflow-hidden">
                    <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, var(--color-accent-tint) 0%, var(--color-bg) 60%, var(--color-accent-tint) 130%)' }}
                    >
                        <div className="dot-pattern-dark absolute inset-0" />
                        <span
                            className="catalog-card-img relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-white shadow-sm"
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
                            className="catalog-card-img absolute inset-0 h-full w-full object-cover"
                        />
                    )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                    <div className="mb-1.5 flex items-center justify-between gap-1.5 text-xs font-medium">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-accent)] uppercase tracking-wider">
                            {item.category_name ?? meta.label}
                        </span>
                        {item.target_audience === 'internal_pnj' && (
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-300/60">
                                🔒 Khusus PNJ
                            </span>
                        )}
                    </div>
                    <h3
                        className="mb-2 line-clamp-2 font-display text-[15px] font-semibold leading-snug group-hover:text-[var(--color-accent)] transition-colors"
                        style={{ color: 'var(--color-ink)' }}
                    >
                        {item.title}
                    </h3>
                    <div className="mt-auto flex items-center justify-between pt-2 border-t border-slate-100">
                        <p className="font-display text-[15px] font-bold" style={{ color: 'var(--color-ink)' }}>
                            {item.price}
                        </p>
                        <span
                            className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-accent-tint)] text-[var(--color-accent)] opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
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

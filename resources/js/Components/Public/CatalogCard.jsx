import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Building2, FlaskConical, Package } from 'lucide-react';
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
                className="group relative flex h-full flex-col overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-white shadow-card transition-all duration-200 hover:-translate-y-1.5 hover:border-[var(--color-accent)] hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2"
            >
                <div
                    aria-hidden
                    className="absolute left-0 right-0 top-0 z-10 h-[3px] bg-gradient-to-r from-[var(--color-gradient-start)] via-[var(--color-gradient-end)] to-[var(--color-gradient-start)] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
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
                    <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)' }}>
                            {item.category_name ?? meta.label}
                        </span>
                        {item.target_audience === 'internal_pnj' && (
                            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold" style={{ background: 'color-mix(in srgb, var(--color-gold) 14%, transparent)', borderColor: 'color-mix(in srgb, var(--color-gold) 40%, transparent)', color: 'var(--color-gold-deep)' }}>
                                Khusus PNJ
                            </span>
                        )}
                    </div>
                    <h3
                        className="mb-2 line-clamp-2 font-display text-[16px] font-bold leading-snug transition-colors duration-150 group-hover:text-[var(--color-accent)]"
                        style={{ color: 'var(--color-ink)' }}
                    >
                        {item.title}
                    </h3>
                    <div className="mt-auto flex items-center justify-between border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                        <p className="font-display text-[15px] font-bold" style={{ color: 'var(--color-ink)' }}>
                            {item.price}
                        </p>
                        <span
                            className="flex h-7 w-7 translate-x-[-6px] items-center justify-center rounded-full text-white opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
                            style={{ background: 'var(--color-accent)' }}
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

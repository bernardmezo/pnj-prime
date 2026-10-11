import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { Building2, FlaskConical, Package } from 'lucide-react';
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
 * Catalog card — single design used by the landing preview and the full
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
                className="group flex h-full flex-col overflow-hidden rounded-[22px] border bg-white transition-all duration-300 hover:-translate-y-1.5 hover:shadow-card-hover"
                style={{ borderColor: 'var(--color-border)' }}
            >
                <div className="relative overflow-hidden">
                    {item.image ? (
                        <img src={item.image} alt="" loading="lazy" className="catalog-card-img aspect-[4/3] w-full object-cover" />
                    ) : (
                        <div
                            className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden"
                            style={{ background: 'linear-gradient(135deg, var(--color-accent-tint) 0%, var(--color-bg) 60%, var(--color-accent-tint) 130%)' }}
                        >
                            <div className="dot-pattern-dark absolute inset-0" />
                            <span
                                className="catalog-card-img relative flex h-14 w-14 items-center justify-center rounded-2xl border bg-white"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-accent)' }}
                            >
                                <TypeIcon className="h-6 w-6" />
                            </span>
                        </div>
                    )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                    <p className="mb-1 text-xs font-medium" style={{ color: 'var(--color-muted)' }}>
                        {item.category_name ?? meta.label}
                    </p>
                    <h3
                        className="mb-2 line-clamp-2 font-display text-[15px] font-semibold leading-snug"
                        style={{ color: 'var(--color-ink)' }}
                    >
                        {item.title}
                    </h3>
                    <p className="mt-auto font-display text-[15px] font-bold" style={{ color: 'var(--color-ink)' }}>
                        {item.price}
                    </p>
                </div>
            </Wrapper>
        </motion.div>
    );
}

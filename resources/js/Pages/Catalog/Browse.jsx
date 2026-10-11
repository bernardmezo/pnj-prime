import { Head, router } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import CatalogCard, { formatRp, typeFromCategory } from '@/Components/Public/CatalogCard';
import PublicLayout from '@/Layouts/PublicLayout';
import { EASE, EmptyState, Pagination } from '@/Components/ui';
import { inputClass, inputStyleProps } from '@/Components/ui';

function toCard(p) {
    return {
        id: p.id,
        type: typeFromCategory(p.category?.slug),
        title: p.name,
        category_name: p.category?.name,
        price: formatRp(p.final_price),
        image: p.thumbnail ?? null,
        slug: p.slug,
    };
}

function FilterPanel({ filters, categories, draft, setDraft, onApply, onReset }) {
    return (
        <div className="space-y-6">
            <div>
                <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Kategori</p>
                <ul className="space-y-1">
                    <li>
                        <button
                            type="button"
                            onClick={() => setDraft((d) => ({ ...d, category: '' }))}
                            className="w-full rounded-xl px-3 py-2 text-start text-sm transition"
                            style={
                                !draft.category
                                    ? { background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)', fontWeight: 600 }
                                    : { color: 'var(--color-muted)' }
                            }
                        >
                            Semua kategori
                        </button>
                    </li>
                    {categories.map((c) => {
                        const on = draft.category === c.slug;
                        return (
                            <li key={c.id}>
                                <button
                                    type="button"
                                    onClick={() => setDraft((d) => ({ ...d, category: on ? '' : c.slug }))}
                                    className="w-full rounded-xl px-3 py-2 text-start text-sm transition"
                                    style={
                                        on
                                            ? { background: 'var(--color-accent-tint)', color: 'var(--color-accent-hover)', fontWeight: 600 }
                                            : { color: 'var(--color-muted)' }
                                    }
                                >
                                    {c.name}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
            <div>
                <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>Rentang harga</p>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="number" min="0" placeholder="Min Rp"
                        value={draft.min_price} onChange={(e) => setDraft((d) => ({ ...d, min_price: e.target.value }))}
                        className={inputClass} {...inputStyleProps()} aria-label="Harga minimum"
                    />
                    <input
                        type="number" min="0" placeholder="Maks Rp"
                        value={draft.max_price} onChange={(e) => setDraft((d) => ({ ...d, max_price: e.target.value }))}
                        className={inputClass} {...inputStyleProps()} aria-label="Harga maksimum"
                    />
                </div>
            </div>
            <div className="flex gap-2">
                <button
                    type="button" onClick={onApply}
                    className="flex-1 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-px active:scale-[0.98]"
                    style={{ background: 'var(--color-accent)' }}
                >
                    Terapkan
                </button>
                <button
                    type="button" onClick={onReset}
                    className="rounded-full border bg-white px-4 py-2.5 text-sm font-semibold transition"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                >
                    Reset
                </button>
            </div>
            {filters.category || filters.min_price || filters.max_price || filters.q ? (
                <p className="text-xs" style={{ color: 'var(--color-muted)' }}>Filter aktif — hasil diperbarui dari server.</p>
            ) : null}
        </div>
    );
}

export default function CatalogBrowse({ auth, products, categories = [], filters = {} }) {
    const reduce = useReducedMotion();
    const [drawer, setDrawer] = useState(false);
    const [q, setQ] = useState(filters.q ?? '');
    const [draft, setDraft] = useState({
        category: filters.category ?? '',
        min_price: filters.min_price ?? '',
        max_price: filters.max_price ?? '',
    });

    const rows = products?.data ?? [];

    function apply(next = {}) {
        const params = {
            q: q.trim() || undefined,
            category: draft.category || undefined,
            min_price: draft.min_price || undefined,
            max_price: draft.max_price || undefined,
            ...next,
        };
        Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
        router.get(route('catalog.index'), params, { preserveState: true, replace: true });
        setDrawer(false);
    }

    function resetAll() {
        setQ('');
        setDraft({ category: '', min_price: '', max_price: '' });
        router.get(route('catalog.index'), {}, { preserveState: true, replace: true });
    }

    return (
        <PublicLayout auth={auth}>
            <Head title="Katalog — PNJ Prime" />

            {/* Light page header band (not a dark hero) */}
            <div className="border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
                <div className="mx-auto w-full max-w-[1240px] px-4 py-10 sm:px-6">
                    <p className="mb-2 text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>Katalog</p>
                    <h1 className="font-display text-3xl font-bold sm:text-4xl" style={{ color: 'var(--color-ink)' }}>
                        Jelajahi seluruh katalog
                    </h1>
                    <p className="mt-2 max-w-xl text-[15px]" style={{ color: 'var(--color-muted)' }}>
                        Produk fisik, jasa pengujian, dan sewa fasilitas hasil riset PNJ — terkurasi Admin RTPU.
                    </p>
                    <form
                        className="relative mt-6 max-w-xl"
                        onSubmit={(e) => { e.preventDefault(); apply(); }}
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
            </div>

            <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6">
                <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
                    {/* Sidebar (desktop) */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 rounded-[22px] border bg-white p-5" style={{ borderColor: 'var(--color-border)' }}>
                            <FilterPanel filters={filters} categories={categories} draft={draft} setDraft={setDraft} onApply={() => apply()} onReset={resetAll} />
                        </div>
                    </aside>

                    <div>
                        {/* Mobile filter button */}
                        <div className="mb-4 flex items-center justify-between lg:hidden">
                            <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
                                {products?.total ?? rows.length} hasil
                            </p>
                            <button
                                type="button" onClick={() => setDrawer(true)}
                                className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold"
                                style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                            >
                                <SlidersHorizontal className="h-4 w-4" /> Filter
                            </button>
                        </div>
                        <p className="mb-4 hidden text-sm lg:block" style={{ color: 'var(--color-muted)' }}>
                            {products?.total ?? rows.length} hasil
                            {filters.q ? <> untuk “{filters.q}”</> : null}
                        </p>

                        {rows.length === 0 ? (
                            <EmptyState
                                icon={PackageSearch}
                                title="Tidak ada hasil"
                                desc="Coba kata kunci lain atau longgarkan filter harga dan kategori."
                                action={
                                    <button type="button" onClick={resetAll} className="rounded-full px-6 py-2.5 text-sm font-semibold text-white" style={{ background: 'var(--color-accent)' }}>
                                        Reset filter
                                    </button>
                                }
                            />
                        ) : (
                            <>
                                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                                    {rows.map((p, i) => (
                                        <CatalogCard key={p.id} item={toCard(p)} index={i % 6} />
                                    ))}
                                </div>
                                <Pagination links={products?.links ?? []} meta={products?.meta} />
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Mobile filter drawer */}
            {!reduce && drawer ? (
                <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="absolute inset-0" style={{ background: 'rgba(26,29,28,0.5)' }} onClick={() => setDrawer(false)} />
                    <motion.div
                        className="absolute inset-y-0 left-0 w-80 max-w-[85vw] overflow-y-auto bg-white p-5"
                        initial={{ x: '-100%' }} animate={{ x: 0 }} transition={{ duration: 0.28, ease: EASE }}
                    >
                        <div className="mb-4 flex items-center justify-between">
                            <p className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>Filter</p>
                            <button type="button" onClick={() => setDrawer(false)} aria-label="Tutup filter" className="rounded-lg p-1.5" style={{ color: 'var(--color-muted)' }}>
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <FilterPanel filters={filters} categories={categories} draft={draft} setDraft={setDraft} onApply={() => apply()} onReset={resetAll} />
                    </motion.div>
                </motion.div>
            ) : drawer ? (
                <div className="fixed inset-0 z-[70] bg-white p-5 lg:hidden">
                    <button type="button" onClick={() => setDrawer(false)} aria-label="Tutup filter" className="mb-4 rounded-lg p-1.5" style={{ color: 'var(--color-muted)' }}>
                        <X className="h-5 w-5" />
                    </button>
                    <FilterPanel filters={filters} categories={categories} draft={draft} setDraft={setDraft} onApply={() => apply()} onReset={resetAll} />
                </div>
            ) : null}
        </PublicLayout>
    );
}

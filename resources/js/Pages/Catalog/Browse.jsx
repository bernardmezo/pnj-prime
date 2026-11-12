import { Head, router } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import { PackageSearch, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
        target_audience: p.target_audience ?? 'publik',
        price: formatRp(p.final_price),
        image: p.thumbnail ?? null,
        slug: p.slug,
        stock: p.stock ?? null,
        availability_status: p.meta?.availability_status ?? 'tersedia',
        preorder_duration: p.meta?.preorder_duration ?? null,
        sold_count: p.sold_count ?? 0,
    };
}

function FilterPanel({ filters, categories, draft, setDraft, onApply, onReset }) {
    const hasActiveFilters = Boolean(filters.category || filters.min_price || filters.max_price || filters.q);

    return (
        <div className="space-y-6">
            <div>
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-gold)' }} />
                    Kategori
                </p>
                <ul className="space-y-1">
                    <li>
                        <button
                            type="button"
                            onClick={() => {
                                setDraft((d) => ({ ...d, category: '' }));
                                onApply({ category: undefined });
                            }}
                            className="w-full rounded-xl px-3 py-2 text-start text-sm transition hover:bg-[var(--color-surface)]"
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
                                    onClick={() => {
                                        const newCat = on ? undefined : c.slug;
                                        setDraft((d) => ({ ...d, category: newCat || '' }));
                                        onApply({ category: newCat });
                                    }}
                                    className="w-full rounded-xl px-3 py-2 text-start text-sm transition hover:bg-[var(--color-surface)]"
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
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-gold)' }} />
                    Rentang harga
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <input
                        type="number" min="0" placeholder="Min Rp"
                        value={draft.min_price}
                        onChange={(e) => {
                            const val = e.target.value;
                            setDraft((d) => ({ ...d, min_price: val }));
                            onApply({ min_price: val });
                        }}
                        className={inputClass} {...inputStyleProps()} aria-label="Harga minimum"
                    />
                    <input
                        type="number" min="0" placeholder="Maks Rp"
                        value={draft.max_price}
                        onChange={(e) => {
                            const val = e.target.value;
                            setDraft((d) => ({ ...d, max_price: val }));
                            onApply({ max_price: val });
                        }}
                        className={inputClass} {...inputStyleProps()} aria-label="Harga maksimum"
                    />
                </div>
            </div>
            {hasActiveFilters ? (
                <div>
                    <button
                        type="button" onClick={onReset}
                        className="w-full rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-tint)]"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)' }}
                    >
                        Reset filter
                    </button>
                    <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-muted)' }}>
                        Filter otomatis diterapkan
                    </p>
                </div>
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

    // Synchronize draft state when page filters prop changes (e.g. back/forward navigation or external links)
    useEffect(() => {
        setQ(filters.q ?? '');
        setDraft({
            category: filters.category ?? '',
            min_price: filters.min_price ?? '',
            max_price: filters.max_price ?? '',
        });
    }, [filters.q, filters.category, filters.min_price, filters.max_price]);

    const rows = products?.data ?? [];

    function pushQuery(targetQ, targetDraft) {
        const queryText = (targetQ !== undefined ? targetQ : q).trim();
        const activeDraft = targetDraft || draft;
        const params = {
            q: queryText || undefined,
            category: activeDraft.category || undefined,
            min_price: activeDraft.min_price || undefined,
            max_price: activeDraft.max_price || undefined,
        };
        Object.keys(params).forEach((k) => params[k] === undefined && delete params[k]);
        router.get(route('catalog.index'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }

    // Debounced apply for inputs like search and price
    const debounceTimerRef = useRef(null);

    function handleSearchChange(val) {
        setQ(val);
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        debounceTimerRef.current = setTimeout(() => {
            pushQuery(val, draft);
        }, 350);
    }

    function handleFilterApply(override = {}) {
        const nextDraft = {
            ...draft,
            ...override,
        };
        setDraft(nextDraft);

        // If it's a category update, trigger immediately; if price, debounce slightly so typing multi digits is smooth
        if (override.category !== undefined) {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            pushQuery(q, nextDraft);
        } else {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            debounceTimerRef.current = setTimeout(() => {
                pushQuery(q, nextDraft);
            }, 400);
        }
    }

    function resetAll() {
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        setQ('');
        setDraft({ category: '', min_price: '', max_price: '' });
        router.get(route('catalog.index'), {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
        setDrawer(false);
    }

    return (
        <PublicLayout auth={auth}>
            <Head title="Katalog · PNJ Prime" />

            {/* Light page header band (not a dark hero) */}
            <div className="relative border-b" style={{ borderColor: 'var(--color-border)', background: 'linear-gradient(180deg, var(--color-surface) 0%, var(--color-bg) 100%)' }}>
                <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[var(--color-gold)] via-[var(--color-accent)] to-[var(--color-gold)]" aria-hidden />
                <div className="mx-auto w-full max-w-[1240px] px-4 py-12 sm:px-6">
                    <p className="mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest" style={{ borderColor: 'color-mix(in srgb, var(--color-accent) 25%, transparent)', color: 'var(--color-accent)', background: 'color-mix(in srgb, var(--color-accent-tint) 50%, transparent)' }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-gold)' }} />
                        Katalog
                    </p>
                    <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-[42px]" style={{ color: 'var(--color-ink)' }}>
                        Jelajahi seluruh katalog
                    </h1>
                    <p className="mt-3 max-w-xl text-[15px] leading-relaxed" style={{ color: 'var(--color-muted)' }}>
                        Produk fisik, jasa pengujian, dan sewa fasilitas hasil riset PNJ, terkurasi Admin RTPU.
                    </p>
                    <form
                        className="relative mt-7 max-w-xl"
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
                            pushQuery(q, draft);
                        }}
                    >
                        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-muted)' }} />
                        <input
                            type="search"
                            value={q}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            placeholder="Cari produk, jasa, atau fasilitas…"
                            aria-label="Cari katalog"
                            className="w-full rounded-full border border-[var(--color-border)] bg-white py-3.5 pl-11 pr-4 text-sm text-[var(--color-ink)] shadow-sm outline-none transition duration-150 focus:border-[var(--color-accent)] focus:ring-4 focus:ring-[var(--color-accent-tint)]"
                        />
                    </form>
                </div>
            </div>

            <div className="mx-auto w-full max-w-[1240px] px-4 py-8 sm:px-6">
                <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
                    {/* Sidebar (desktop) */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 rounded-2xl border border-[var(--color-border)] bg-white p-5 shadow-card">
                            <FilterPanel
                                filters={filters}
                                categories={categories}
                                draft={draft}
                                setDraft={setDraft}
                                onApply={handleFilterApply}
                                onReset={resetAll}
                            />
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
                                className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-ink)] shadow-sm transition hover:border-[var(--color-accent)]"
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
                        <FilterPanel
                            filters={filters}
                            categories={categories}
                            draft={draft}
                            setDraft={setDraft}
                            onApply={handleFilterApply}
                            onReset={resetAll}
                        />
                    </motion.div>
                </motion.div>
            ) : drawer ? (
                <div className="fixed inset-0 z-[70] bg-white p-5 lg:hidden">
                    <button type="button" onClick={() => setDrawer(false)} aria-label="Tutup filter" className="mb-4 rounded-lg p-1.5" style={{ color: 'var(--color-muted)' }}>
                        <X className="h-5 w-5" />
                    </button>
                    <FilterPanel
                        filters={filters}
                        categories={categories}
                        draft={draft}
                        setDraft={setDraft}
                        onApply={handleFilterApply}
                        onReset={resetAll}
                    />
                </div>
            ) : null}
        </PublicLayout>
    );
}

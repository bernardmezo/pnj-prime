import { Head, router } from '@inertiajs/react';
import { PackageSearch, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import CatalogCard, { formatRp, typeFromCategory } from '@/Components/Public/CatalogCard';
import PublicLayout from '@/Layouts/PublicLayout';
import { EmptyState, Pagination } from '@/Components/ui';
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

export default function CatalogBrowse({ auth, products, categories = [], filters = {} }) {
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
    }

    return (
        <PublicLayout auth={auth}>
            <Head title="Katalog · PNJ Prime" />
            <div className="mx-auto max-w-[1240px] px-4 py-7 sm:px-6 sm:py-9">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">Jelajahi katalog PNJ</h1>
                        <p className="mt-2 text-sm text-[var(--color-muted)]">Produk fisik, jasa pengujian, dan sewa fasilitas hasil riset PNJ.</p>
                    </div>
                    <form className="relative w-full md:max-w-md" onSubmit={(e) => { e.preventDefault(); if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); pushQuery(q, draft); }}>
                        <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-[var(--color-muted)]" />
                        <input type="search" value={q} onChange={(e) => handleSearchChange(e.target.value)} placeholder="Cari produk, jasa, atau fasilitas…" aria-label="Cari katalog" className="w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] py-3 pl-12 pr-4 text-sm focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]" />
                    </form>
                </div>
                <div className="mb-6 border-y border-[var(--color-border)] py-4">
                    <div className="flex flex-wrap gap-2" aria-label="Kategori katalog">
                        {[{ id: 'all', slug: '', name: 'Semua kategori' }, ...categories].map((c) => (
                            <button type="button" key={c.id} onClick={() => handleFilterApply({ category: c.slug })} aria-pressed={draft.category === c.slug}
                                className={`rounded-full border px-4 py-2 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 ${draft.category === c.slug ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white' : 'border-[var(--color-border)] text-[var(--color-muted)] hover:bg-[var(--color-surface)]'}`}>{c.name}</button>
                        ))}
                    </div>
                    <div className="mt-4 flex flex-wrap items-end gap-3">
                        <label className="flex-1 text-xs text-[var(--color-muted)] sm:max-w-44">Harga minimum
                            <input type="number" min="0" value={draft.min_price} onChange={(e) => handleFilterApply({ min_price: e.target.value })} placeholder="Rp" className={`${inputClass} mt-1 w-full`} {...inputStyleProps()} />
                        </label>
                        <label className="flex-1 text-xs text-[var(--color-muted)] sm:max-w-44">Harga maksimum
                            <input type="number" min="0" value={draft.max_price} onChange={(e) => handleFilterApply({ max_price: e.target.value })} placeholder="Rp" className={`${inputClass} mt-1 w-full`} {...inputStyleProps()} />
                        </label>
                        {(q || draft.category || draft.min_price || draft.max_price) && <button type="button" onClick={resetAll} className="rounded-full px-4 py-2.5 text-sm font-semibold text-[var(--color-accent)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]">Reset filter</button>}
                        <p className="w-full text-sm text-[var(--color-muted)] sm:ml-auto sm:w-auto"><strong className="text-[var(--color-ink)]">{products?.total ?? rows.length}</strong> hasil{filters.q ? ` untuk “${filters.q}”` : ''}</p>
                    </div>
                </div>
                {rows.length === 0 ? <EmptyState icon={PackageSearch} title="Tidak ada hasil" desc="Coba kata kunci lain atau longgarkan filter harga dan kategori." /> : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{rows.map((p, i) => <CatalogCard key={p.id} item={toCard(p)} index={i % 6} />)}</div>
                        <Pagination links={products?.links ?? []} meta={products?.meta} />
                    </>
                )}
            </div>
        </PublicLayout>
    );
}

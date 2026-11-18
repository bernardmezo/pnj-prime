import { Head, router, usePage } from '@inertiajs/react';
import { Download } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import AlertBanner from '@/Components/AlertBanner';
import { EmptyState, PageHeader, Panel, Skeleton, StatRow } from '@/Components/Dashboard/SharedDashboard';
import { AreaChart, ColumnChart, DonutChart, HorizontalBars, formatRupiah, formatRupiahSingkat } from '@/Components/Dashboard/SimpleCharts';

const PRESETS = [
    { key: '30hari', label: '30 hari' },
    { key: '90hari', label: '90 hari' },
    { key: 'tahun', label: 'Tahun ini' },
];

const inputCls =
    'rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/30';

function SectionTitle({ title, desc }) {
    return (
        <div className="mb-4">
            <h2 className="text-base font-semibold text-[var(--color-ink)]">{title}</h2>
            {desc && <p className="mt-0.5 text-xs text-[var(--color-muted)]">{desc}</p>}
        </div>
    );
}

function LoadingState() {
    return (
        <div className="space-y-8" role="status" aria-live="polite" aria-label="Memuat ringkasan">
            <Panel><div className="grid grid-cols-2 gap-6 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => (
                <div key={i} className="space-y-2"><Skeleton className="h-8 w-28" /><Skeleton className="h-3 w-24" /></div>
            ))}</div></Panel>
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {[0, 1, 2, 3].map((i) => <Panel key={i}><Skeleton className="mb-4 h-4 w-40" /><Skeleton className="h-44 w-full" /></Panel>)}
            </div>
            <span className="sr-only">Memuat ringkasan…</span>
        </div>
    );
}

export default function DirekturDashboard({ filters, summary }) {
    const { errors = {} } = usePage().props;
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [busy, setBusy] = useState(false);

    const go = (params) =>
        router.get(route('direktur.dashboard'), params, {
            preserveState: true, preserveScroll: true, replace: true,
            onStart: () => setBusy(true), onFinish: () => setBusy(false),
        });

    const exportHref = route('direktur.dashboard.export', { from: filters.from, to: filters.to });
    const loading = !summary || busy;
    const sales = summary?.sales;
    const funnel = summary?.funnel;
    const accounts = summary?.accounts;
    const nego = summary?.negotiation;
    const perDay = summary?.range?.granularity === 'day';
    const hasSales = (sales?.kpi?.transaksi ?? 0) > 0;
    const funnelEmpty = !funnel || (funnel.tahap.every((t) => t.jumlah === 0) && funnel.draft === 0);

    return (
        <DashboardLayout title="Dashboard" activeKey="dashboard">
            <Head title="Ringkasan Eksekutif · PNJ Prime" />

            <PageHeader title="Ringkasan Eksekutif" subtitle="Pantauan penjualan, alur produk, dan akun. Hanya untuk dilihat." />

            {/* Filter periode (hanya baca: mengubah tampilan, bukan data) */}
            <Panel className="mb-8 !p-4 sm:!p-5">
                <form
                    onSubmit={(e) => { e.preventDefault(); go({ from, to }); }}
                    className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
                >
                    <div className="flex flex-wrap items-end gap-3">
                        <div role="group" aria-label="Periode cepat" className="flex overflow-hidden rounded-xl border border-[var(--color-border)]">
                            {PRESETS.map((p) => {
                                const active = filters.preset ? filters.preset === p.key : p.key === '30hari' && filters.isDefault;
                                return (
                                    <button
                                        key={p.key} type="button" onClick={() => go({ preset: p.key })}
                                        aria-pressed={Boolean(active)}
                                        className={`px-3.5 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] ${active ? 'bg-[var(--color-accent)] text-white' : 'bg-white text-[var(--color-ink)] hover:bg-[var(--color-surface)]'}`}
                                    >
                                        {p.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div>
                            <label htmlFor="f-from" className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Dari</label>
                            <input id="f-from" type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                            <label htmlFor="f-to" className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Sampai</label>
                            <input id="f-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={inputCls} />
                        </div>
                        <button type="submit" disabled={busy} className="rounded-xl bg-[var(--color-ink)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]">
                            Terapkan
                        </button>
                    </div>
                    <a href={exportHref} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]">
                        <Download className="h-4 w-4" aria-hidden /> Unduh CSV
                    </a>
                </form>
                {(errors.from || errors.to || errors.preset) && (
                    <AlertBanner className="mt-4" type="error" message={errors.from || errors.to || errors.preset} />
                )}
            </Panel>

            {loading ? <LoadingState /> : (
                <div className="space-y-8">
                    {/* KPI */}
                    <Panel>
                        <StatRow stats={[
                            { label: 'Omzet (total dibayar)', value: sales.kpi.omzet_total, formattedValue: formatRupiah(sales.kpi.omzet_total), helper: 'Termasuk pajak' },
                            { label: 'Omzet sebelum pajak', value: sales.kpi.omzet_subtotal, formattedValue: formatRupiah(sales.kpi.omzet_subtotal) },
                            { label: 'Transaksi selesai', value: sales.kpi.transaksi },
                            { label: 'Negosiasi harga berjalan', value: nego.berjalan, helper: `${nego.menunggu_pengelola} menunggu Pengelola · ${nego.menunggu_rtpu} menunggu RTPU` },
                        ]} />
                    </Panel>

                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                        {/* Tren penjualan */}
                        <Panel className="lg:col-span-2">
                            <SectionTitle title="Tren penjualan" desc={`Omzet total dari pesanan selesai, per ${perDay ? 'hari' : 'bulan'}.`} />
                            {!hasSales ? <EmptyState message="Belum ada pesanan selesai pada periode ini." /> : (
                                <AreaChart
                                    points={sales.series.map((s) => ({ key: s.key, label: s.label, value: s.total }))}
                                    ariaLabel={`Tren omzet ${perDay ? 'harian' : 'bulanan'}, total ${formatRupiah(sales.kpi.omzet_total)} dari ${sales.kpi.transaksi} transaksi.`}
                                />
                            )}
                        </Panel>

                        {/* Funnel */}
                        <Panel>
                            <SectionTitle title="Alur produk" desc="Jumlah produk per tahap, berdasarkan status saat ini (produk yang dibuat pada periode)." />
                            {funnelEmpty ? <EmptyState message="Belum ada produk pada periode ini." /> : (
                                <>
                                    <HorizontalBars
                                        ariaLabel="Jumlah produk per tahap alur"
                                        items={funnel.tahap.map((t) => ({ key: t.key, label: t.label, value: t.jumlah, color: t.key === 'ditolak' ? 'var(--color-danger)' : t.key === 'revisi_harga' ? 'var(--color-gold)' : undefined }))}
                                    />
                                    <p className="mt-4 text-xs text-[var(--color-muted)]">Draft belum diajukan: {funnel.draft}. Total produk: {funnel.total}.</p>
                                </>
                            )}
                        </Panel>

                        {/* Per kategori */}
                        <Panel>
                            <SectionTitle title="Penjualan per kategori" desc="Nilai sebelum pajak dari pesanan selesai." />
                            {sales.per_kategori.length === 0 ? <EmptyState message="Belum ada penjualan pada periode ini." /> : (
                                <DonutChart
                                    slices={sales.per_kategori.map((k) => ({ label: k.kategori, value: k.total }))}
                                    valueFormat={formatRupiahSingkat}
                                    centerLabel={formatRupiahSingkat(sales.kpi.omzet_subtotal)}
                                />
                            )}
                        </Panel>

                        {/* Terlaris */}
                        <Panel noPadding className="overflow-hidden">
                            <div className="border-b border-[var(--color-border)] p-6"><SectionTitle title="10 produk terlaris" desc="Berdasarkan jumlah terjual pada periode." /></div>
                            {sales.terlaris.length === 0 ? <div className="p-6"><EmptyState message="Belum ada produk terjual pada periode ini." /></div> : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <caption className="sr-only">10 produk terlaris pada periode terpilih</caption>
                                        <thead><tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-[11px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                                            <th scope="col" className="px-6 py-3">#</th><th scope="col" className="px-2 py-3">Produk</th>
                                            <th scope="col" className="px-4 py-3 text-right">Terjual</th><th scope="col" className="px-6 py-3 text-right">Penjualan</th>
                                        </tr></thead>
                                        <tbody className="divide-y divide-[var(--color-border)]">
                                            {sales.terlaris.map((p, i) => (
                                                <tr key={p.product_id ?? i} className="hover:bg-[var(--color-surface)]">
                                                    <td className="px-6 py-3 tabular-nums text-[var(--color-muted)]">{i + 1}</td>
                                                    <td className="max-w-[220px] truncate px-2 py-3 font-medium text-[var(--color-ink)]" title={p.nama}>{p.nama}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums">{p.qty}</td>
                                                    <td className="px-6 py-3 text-right tabular-nums font-semibold">{formatRupiah(p.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Panel>

                        {/* Akun */}
                        <Panel>
                            <SectionTitle title="Akun terdaftar" desc={`Total ${accounts.total} akun. Hanya angka agregat.`} />
                            <HorizontalBars
                                ariaLabel="Jumlah akun per peran"
                                items={accounts.per_role.map((r) => ({ key: r.label, label: r.label, value: r.jumlah }))}
                            />
                        </Panel>

                        <Panel className="lg:col-span-2">
                            <SectionTitle title="Pertumbuhan pendaftaran" desc="Akun baru per bulan pada periode." />
                            {accounts.pertumbuhan.every((g) => g.jumlah === 0)
                                ? <EmptyState message="Belum ada pendaftaran baru pada periode ini." />
                                : <ColumnChart points={accounts.pertumbuhan.map((g) => ({ key: g.key, label: g.label, value: g.jumlah }))} ariaLabel="Pendaftaran akun baru per bulan" />}
                        </Panel>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

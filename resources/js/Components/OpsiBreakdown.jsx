import { Loader2 } from 'lucide-react';
import { SATUAN_LABEL } from '@/lib/opsi';
import { formatRupiah } from '@/lib/money';

const GROUP_ORDER = ['base', 'termasuk', 'addon'];
const GROUP_LABEL = { base: 'Layanan', termasuk: 'Termasuk', addon: 'Dipilih' };

function groupOf(line) {
    if (line.kind === 'base') return 'base';
    if (line.kind === 'termasuk' || line.jenis === 'termasuk') return 'termasuk';
    return 'addon';
}

/**
 * OpsiBreakdown — read-only money breakdown of a quote or a frozen snapshot.
 *
 * It never computes prices: every number comes from the server-produced quote
 * (live selection) or the append-only `pengajuan_opsi` snapshot. Base lines are
 * shown first, then free "Termasuk" items, then selected add-ons.
 *
 * @param {object} props
 * @param {Array<object>} [props.lines]
 * @param {number|null} [props.subtotal]
 * @param {number|null} [props.ppn]
 * @param {number|null} [props.total]
 * @param {boolean} [props.showTotals]  render subtotal/ppn/total footer
 * @param {boolean} [props.loading]
 * @param {string|null} [props.error]
 * @param {string} [props.title]
 * @param {string} [props.emptyText]
 */
export default function OpsiBreakdown({
    lines = [],
    subtotal = null,
    ppn = null,
    total = null,
    showTotals = false,
    loading = false,
    error = null,
    title = 'Rincian biaya',
    emptyText = 'Tidak ada opsi tambahan.',
}) {
    const rows = (lines ?? []).filter(Boolean);
    const grouped = GROUP_ORDER.map((group) => [group, rows.filter((l) => groupOf(l) === group)]).filter(
        ([, list]) => list.length > 0,
    );
    const hasTotals = showTotals && total != null;

    return (
        <section
            className="rounded-2xl border p-4"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
            aria-label={title}
            data-testid="opsi-breakdown"
        >
            <h3 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                {title}
            </h3>
            <p className="mt-0.5 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                Angka dihitung oleh server, bukan oleh tampilan ini.
            </p>

            {loading && (
                <p className="mt-3 inline-flex items-center gap-2 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                    <Loader2 className="h-4 w-4 animate-spin" /> Menghitung…
                </p>
            )}
            {!loading && error && (
                <p className="mt-3 text-[13px]" role="alert" style={{ color: 'var(--color-danger)' }}>
                    {error}
                </p>
            )}
            {!loading && !error && rows.length === 0 && (
                <p className="mt-3 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                    {emptyText}
                </p>
            )}

            {!loading && !error && grouped.map(([group, list]) => (
                <div key={group} className="mt-3">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                        {GROUP_LABEL[group]}
                    </p>
                    <dl className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                        {list.map((line, i) => {
                            const gratis = group !== 'base' && Number(line.subtotal ?? 0) === 0;
                            return (
                                <div key={`${group}-${line.opsi_id ?? line.nama}-${i}`} className="flex items-start justify-between gap-4 py-2 text-sm">
                                    <dt className="min-w-0" style={{ color: 'var(--color-muted)' }}>
                                        <span className="block truncate" style={{ color: 'var(--color-ink)' }}>{line.nama}</span>
                                        <span className="block text-xs">
                                            {SATUAN_LABEL[line.satuan] ?? line.satuan}
                                            {line.qty > 1 ? ` · ${line.qty}×` : ''}
                                            {group === 'base' && line.multiplier > 1 ? ` · ×${line.multiplier}` : ''}
                                        </span>
                                    </dt>
                                    <dd className="shrink-0 font-medium" style={{ color: gratis ? 'var(--color-accent-hover)' : 'var(--color-ink)' }}>
                                        {gratis ? 'Gratis' : formatRupiah(line.subtotal)}
                                    </dd>
                                </div>
                            );
                        })}
                    </dl>
                </div>
            ))}

            {!loading && !error && hasTotals && (
                <dl className="mt-3 divide-y border-t pt-2" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex items-center justify-between gap-4 py-2 text-sm">
                        <dt style={{ color: 'var(--color-muted)' }}>Subtotal</dt>
                        <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{formatRupiah(subtotal)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2 text-sm">
                        <dt style={{ color: 'var(--color-muted)' }}>PPN</dt>
                        <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{formatRupiah(ppn)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-2 text-sm font-semibold">
                        <dt style={{ color: 'var(--color-ink)' }}>Total</dt>
                        <dd style={{ color: 'var(--color-accent-hover)' }} data-testid="breakdown-total">{formatRupiah(total)}</dd>
                    </div>
                </dl>
            )}
        </section>
    );
}

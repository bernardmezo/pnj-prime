import { Check, Sparkles } from 'lucide-react';
import Checkbox from '@/Components/ui/Checkbox';
import NumberStepper from '@/Components/ui/NumberStepper';
import { SATUAN_LABEL } from '@/lib/opsi';
import { formatRupiah } from '@/lib/money';

function hargaLabel(o) {
    if (o.jenis === 'termasuk') return 'Gratis';
    const unit = SATUAN_LABEL[o.satuan] ?? o.satuan;
    return `${formatRupiah(o.harga)}${o.satuan === 'flat' ? '' : ` / ${unit.replace(/^Per /, '')}`}`;
}

function batasQty(o) {
    const min = Math.max(1, Number(o.qty_min) || 1);
    const caps = [o.qty_max, o.stok]
        .map((v) => (v == null || v === '' ? null : Number(v)))
        .filter((v) => Number.isFinite(v));
    const max = caps.length > 0 ? Math.max(min, Math.min(...caps)) : undefined;
    return { min, max };
}

/**
 * OpsiPicker — customer-facing option selection for a listing.
 *
 * "Termasuk" items are always included and free (not selectable); add-ons are
 * opt-in Checkboxes with a NumberStepper that respects qty_min/qty_max/stok.
 * The parent owns the value object (`{ [opsiId]: qty }`) and the server quote.
 *
 * @param {object} props
 * @param {Array<object>} props.options
 * @param {Record<string|number, number>} [props.value]
 * @param {(next: Record<string, number>) => void} props.onChange
 */
export default function OpsiPicker({ options = [], value = {}, onChange, heading = 'Opsi & add-on' }) {
    const termasuk = (options ?? []).filter((o) => o.jenis === 'termasuk');
    const addon = (options ?? []).filter((o) => o.jenis !== 'termasuk');

    if (termasuk.length === 0 && addon.length === 0) return null;

    const toggle = (o, checked) => {
        const next = { ...value };
        if (checked) {
            const { min } = batasQty(o);
            next[o.id] = Math.max(Number(value[o.id]) || 0, min);
        } else {
            delete next[o.id];
        }
        onChange?.(next);
    };

    const setQty = (o, qty) => onChange?.({ ...value, [o.id]: qty });

    return (
        <section
            className="space-y-4 rounded-2xl border p-4"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
            aria-label={heading}
            data-testid="opsi-picker"
        >
            <div>
                <h3 className="inline-flex items-center gap-1.5 font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                    <Sparkles className="h-4 w-4" style={{ color: 'var(--color-accent)' }} /> {heading}
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                    Pilih tambahan sesuai kebutuhan Anda. Harga dikonfirmasi server.
                </p>
            </div>

            {termasuk.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                        Sudah termasuk
                    </p>
                    <ul className="grid gap-2 sm:grid-cols-2">
                        {termasuk.map((o) => (
                            <li
                                key={o.id ?? o.nama}
                                className="flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm"
                                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                            >
                                <Check className="h-4 w-4 shrink-0" style={{ color: 'var(--color-accent)' }} />
                                <span className="min-w-0">
                                    <span className="block truncate font-medium" style={{ color: 'var(--color-ink)' }}>{o.nama}</span>
                                    <span className="block text-xs" style={{ color: 'var(--color-muted)' }}>Gratis · termasuk harga</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {addon.length > 0 && (
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                        Add-on opsional
                    </p>
                    <ul className="space-y-2">
                        {addon.map((o) => {
                            const checked = value[o.id] != null;
                            const { min, max } = batasQty(o);
                            return (
                                <li
                                    key={o.id ?? o.nama}
                                    className="rounded-xl border p-3.5"
                                    style={{
                                        borderColor: checked ? 'var(--color-accent)' : 'var(--color-border)',
                                        background: checked ? 'var(--color-accent-tint)' : 'var(--color-bg)',
                                    }}
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <Checkbox
                                            checked={checked}
                                            onChange={(v) => toggle(o, v)}
                                            label={o.nama}
                                            description={`${hargaLabel(o)}${o.qty_max ? ` · maks ${o.qty_max}` : ''}${o.stok != null ? ` · stok ${o.stok}` : ''}`}
                                        />
                                        {checked && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs" style={{ color: 'var(--color-muted)' }}>Jumlah</span>
                                                <NumberStepper
                                                    label={`Jumlah ${o.nama}`}
                                                    min={min}
                                                    max={max}
                                                    value={Number(value[o.id]) || min}
                                                    onChange={(v) => setQty(o, v)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}
        </section>
    );
}

import { useEffect, useMemo, useState } from 'react';
import {
    ArrowDown,
    ArrowUp,
    Copy,
    Eye,
    Loader2,
    Plus,
    RotateCcw,
    Sparkles,
    Trash2,
} from 'lucide-react';
import MoneyInput from '@/Components/ui/MoneyInput';
import NumberStepper from '@/Components/ui/NumberStepper';
import Select from '@/Components/ui/Select';
import Switch from '@/Components/ui/Switch';
import TextInput from '@/Components/ui/TextInput';
import { emptyOpsiRow, newOpsiKey, renumberOpsi, satuanOptions } from '@/lib/opsi';
import { formatRupiah } from '@/lib/money';

const JENIS_LABEL = { termasuk: 'Termasuk', addon: 'Add-on' };

/** Collapse a list into a stable dependency key (avoids effect churn). */
function listKey(rows) {
    return rows.map((r) => `${r._key}:${r.jenis}:${r.nama}:${r.harga}:${r.satuan}:${r.qty_min}:${r.aktif}`).join('|');
}

function hitungUrl() {
    try {
        return route('customer.pengajuan.hitung');
    } catch {
        return '/pengajuan/hitung';
    }
}

function csrfToken() {
    if (typeof document === 'undefined') return '';
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function IconButton({ label, onClick, disabled = false, danger = false, children }) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            className="flex h-8 w-8 items-center justify-center rounded-lg border transition disabled:cursor-not-allowed disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
            style={{
                borderColor: 'var(--color-border)',
                color: danger ? 'var(--color-danger)' : 'var(--color-muted)',
                background: 'var(--color-bg)',
            }}
        >
            {children}
        </button>
    );
}

function OpsiRow({
    row,
    index,
    count,
    max,
    tipe,
    readOnly,
    onPatch,
    onDuplicate,
    onRemove,
    onMove,
}) {
    const units = satuanOptions(tipe);
    const isTermasuk = row.jenis === 'termasuk';
    const label = row.nama || `${JENIS_LABEL[row.jenis]} #${index + 1}`;

    return (
        <div
            className="space-y-3 rounded-2xl border p-4"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
            <div className="flex items-start justify-between gap-2">
                <p className="pt-2 text-xs font-semibold" style={{ color: 'var(--color-muted)' }}>
                    {JENIS_LABEL[row.jenis]} #{index + 1}
                    {row.id ? ` · tersimpan` : ''}
                </p>
                {!readOnly && (
                    <div className="flex items-center gap-1.5">
                        <IconButton
                            label={`Naikkan ${label}`}
                            onClick={() => onMove(row, -1)}
                            disabled={index === 0}
                        >
                            <ArrowUp className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                            label={`Turunkan ${label}`}
                            onClick={() => onMove(row, 1)}
                            disabled={index === count - 1}
                        >
                            <ArrowDown className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                            label={`Duplikat ${label}`}
                            onClick={() => onDuplicate(row)}
                            disabled={count >= max}
                        >
                            <Copy className="h-4 w-4" />
                        </IconButton>
                        <IconButton label={`Hapus ${label}`} onClick={() => onRemove(row)} danger>
                            <Trash2 className="h-4 w-4" />
                        </IconButton>
                    </div>
                )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                    id={`opsi-${row._key}-nama`}
                    label="Nama"
                    placeholder={isTermasuk ? 'mis. Proyektor' : 'mis. Sound system'}
                    value={row.nama}
                    disabled={readOnly}
                    onChange={(e) => onPatch(row, { nama: e.target.value })}
                />
                <TextInput
                    id={`opsi-${row._key}-deskripsi`}
                    label="Deskripsi"
                    placeholder="Keterangan singkat (opsional)"
                    value={row.deskripsi}
                    disabled={readOnly}
                    onChange={(e) => onPatch(row, { deskripsi: e.target.value })}
                />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <MoneyInput
                    label="Harga"
                    value={isTermasuk ? 0 : row.harga}
                    disabled={readOnly || isTermasuk}
                    onChange={(v) => onPatch(row, { harga: v })}
                    hint={isTermasuk ? 'Item termasuk selalu gratis (Rp 0).' : undefined}
                />
                <Select
                    label="Satuan"
                    value={units.some((u) => u.value === row.satuan) ? row.satuan : units[0]?.value}
                    options={units}
                    disabled={readOnly}
                    onChange={(v) => onPatch(row, { satuan: v })}
                />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
                <NumberStepper
                    label="Min. qty"
                    min={1}
                    value={Number(row.qty_min) || 1}
                    disabled={readOnly}
                    onChange={(v) => onPatch(row, { qty_min: v })}
                />
                <TextInput
                    id={`opsi-${row._key}-qty-max`}
                    label="Maks. qty"
                    type="number"
                    min={1}
                    inputMode="numeric"
                    placeholder="Tanpa batas"
                    value={row.qty_max ?? ''}
                    disabled={readOnly}
                    onChange={(e) =>
                        onPatch(row, { qty_max: e.target.value === '' ? null : Number(e.target.value) })
                    }
                />
                <TextInput
                    id={`opsi-${row._key}-stok`}
                    label="Stok"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    placeholder="Tanpa batas"
                    value={row.stok ?? ''}
                    disabled={readOnly}
                    onChange={(e) =>
                        onPatch(row, { stok: e.target.value === '' ? null : Number(e.target.value) })
                    }
                />
            </div>

            <div className="flex items-center justify-between gap-3">
                <Switch
                    checked={Boolean(row.aktif)}
                    disabled={readOnly}
                    label="Aktif"
                    onChange={(v) => onPatch(row, { aktif: v })}
                />
                <div className="w-36">
                    <NumberStepper
                        label="Urutan"
                        min={0}
                        value={Number(row.urutan) || 0}
                        disabled={readOnly}
                        onChange={(v) => onPatch(row, { urutan: v })}
                    />
                </div>
            </div>
        </div>
    );
}

/**
 * OpsiEditor — manage a listing's "Termasuk" (free) and "Add-on" options.
 *
 * Controlled: `value` is an array of rows, `onChange(rows)` returns the full,
 * re-numbered array. A read-only "Pratinjau pelanggan" calls the server quote
 * endpoint (debounced) so the client never computes the authoritative total.
 *
 * @param {object} props
 * @param {Array<object>} props.value
 * @param {(rows: Array<object>) => void} props.onChange
 * @param {'jasa'|'ruangan'|'produk'} props.tipe
 * @param {Array<{nama:string,harga:number,satuan:string,jenis?:string}>} [props.suggestions]
 * @param {boolean} [props.readOnly]
 * @param {number} [props.max]                max rows per list (default 20)
 * @param {number|null} [props.productId]     enable the customer preview when set
 * @param {object} [props.selection]          {jumlah, peserta, jam_mulai, jam_selesai}
 * @param {number} [props.debounceMs]         preview debounce (default 400)
 */
export default function OpsiEditor({
    value = [],
    onChange,
    tipe = 'jasa',
    suggestions = [],
    readOnly = false,
    max = 20,
    productId = null,
    selection = {},
    debounceMs = 400,
}) {
    const termasuk = value.filter((r) => r.jenis === 'termasuk');
    const addon = value.filter((r) => r.jenis === 'addon');

    const [undoStack, setUndoStack] = useState([]);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [previewError, setPreviewError] = useState(null);

    const selectionKey = JSON.stringify(selection ?? {});
    const addonKey = listKey(addon);

    const setList = (jenis, nextList) => {
        const others = value.filter((r) => r.jenis !== jenis);
        const merged = jenis === 'termasuk' ? [...nextList, ...others] : [...others, ...nextList];
        onChange?.(renumberOpsi(merged));
    };

    const patch = (row, patchData) => {
        let fields = patchData;
        if (row.jenis === 'termasuk' && 'harga' in fields) {
            fields = { ...fields, harga: 0 };
        }
        onChange?.(value.map((r) => (r._key === row._key ? { ...r, ...fields } : r)));
    };

    const addRow = (jenis, seed = {}) => {
        const list = jenis === 'termasuk' ? termasuk : addon;
        if (list.length >= max) return;
        const row = emptyOpsiRow(jenis, { ...seed, tipe });
        setList(jenis, [...list, row]);
    };

    const duplicateRow = (row) => {
        const list = row.jenis === 'termasuk' ? termasuk : addon;
        if (list.length >= max) return;
        const index = list.findIndex((r) => r._key === row._key);
        const copy = {
            ...row,
            _key: newOpsiKey(),
            id: null,
            nama: row.nama ? `${row.nama} (salinan)` : '',
        };
        const next = [...list];
        next.splice(index + 1, 0, copy);
        setList(row.jenis, next);
    };

    const removeRow = (row) => {
        const list = row.jenis === 'termasuk' ? termasuk : addon;
        const index = list.findIndex((r) => r._key === row._key);
        if (index < 0) return;
        setUndoStack((stack) => [...stack.slice(-24), { jenis: row.jenis, index, row }]);
        setList(row.jenis, list.filter((r) => r._key !== row._key));
    };

    const undo = () => {
        setUndoStack((stack) => {
            if (stack.length === 0) return stack;
            const entry = stack[stack.length - 1];
            const current = value.filter((r) => r.jenis === entry.jenis);
            const next = [...current];
            next.splice(Math.min(entry.index, next.length), 0, entry.row);
            const others = value.filter((r) => r.jenis !== entry.jenis);
            const merged =
                entry.jenis === 'termasuk' ? [...next, ...others] : [...others, ...next];
            onChange?.(renumberOpsi(merged));
            return stack.slice(0, -1);
        });
    };

    const moveRow = (row, direction) => {
        const list = row.jenis === 'termasuk' ? termasuk : addon;
        const index = list.findIndex((r) => r._key === row._key);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= list.length) return;
        const next = [...list];
        [next[index], next[target]] = [next[target], next[index]];
        setList(row.jenis, next);
    };

    // ---- customer preview (server-authoritative total) ----
    const previewPayload = useMemo(() => {
        if (readOnly === false && productId) {
            const picked = addon
                .filter((r) => r.id && r.aktif)
                .map((r) => ({ id: r.id, qty: Math.max(1, Number(r.qty_min) || 1) }));
            if (picked.length > 0) {
                return { product_id: productId, opsi: picked };
            }
        }
        return null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId, addonKey]);

    useEffect(() => {
        if (!previewPayload) {
            setPreview(null);
            setPreviewError(null);
            setLoading(false);
            return undefined;
        }

        const controller = new AbortController();
        setLoading(true);
        setPreviewError(null);
        const timer = setTimeout(async () => {
            try {
                const res = await fetch(hitungUrl(), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken(),
                    },
                    body: JSON.stringify({ tipe, ...selection, ...previewPayload }),
                    signal: controller.signal,
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body?.message ?? `Gagal menghitung (${res.status}).`);
                }
                setPreview(await res.json());
            } catch (err) {
                if (err?.name !== 'AbortError') {
                    setPreviewError(err?.message ?? 'Gagal menghitung pratinjau.');
                }
            } finally {
                setLoading(false);
            }
        }, debounceMs);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [previewPayload, tipe, selectionKey, addonKey, debounceMs]);

    const renderSection = (jenis, rows) => {
        const full = rows.length >= max;
        return (
            <section
                className="rounded-2xl border p-4"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}
                aria-label={JENIS_LABEL[jenis]}
            >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <h3 className="font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                            {JENIS_LABEL[jenis]}
                        </h3>
                        <p className="text-[13px]" style={{ color: 'var(--color-muted)' }}>
                            {jenis === 'termasuk'
                                ? 'Dikenakan Rp 0 — termasuk dalam harga layanan.'
                                : 'Opsional, dipilih pelanggan saat mengajukan.'}
                        </p>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: full ? 'var(--color-danger)' : 'var(--color-muted)' }}>
                        {rows.length}/{max}
                    </span>
                </div>

                <div className="space-y-3">
                    {rows.length === 0 && (
                        <p className="rounded-xl border border-dashed px-4 py-6 text-center text-[13px]" style={{ borderColor: 'var(--color-border)', color: 'var(--color-muted)' }}>
                            Belum ada item.
                        </p>
                    )}
                    {rows.map((row, index) => (
                        <OpsiRow
                            key={row._key}
                            row={row}
                            index={index}
                            count={rows.length}
                            max={max}
                            tipe={tipe}
                            readOnly={readOnly}
                            onPatch={patch}
                            onDuplicate={duplicateRow}
                            onRemove={removeRow}
                            onMove={moveRow}
                        />
                    ))}
                </div>

                {!readOnly && (
                    <button
                        type="button"
                        onClick={() => addRow(jenis)}
                        disabled={full}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-accent-hover)', background: 'var(--color-bg)' }}
                    >
                        <Plus className="h-4 w-4" /> Tambah {jenis === 'termasuk' ? 'termasuk' : 'add-on'}
                    </button>
                )}
            </section>
        );
    };

    return (
        <div className="space-y-4" data-testid="opsi-editor">
            {undoStack.length > 0 && !readOnly && (
                <div
                    role="status"
                    className="flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm"
                    style={{ background: 'var(--color-accent-tint)', color: 'var(--color-ink)' }}
                >
                    <span>
                        {undoStack.length} item dihapus baru-baru ini.
                    </span>
                    <button
                        type="button"
                        onClick={undo}
                        className="inline-flex items-center gap-1.5 font-semibold"
                        style={{ color: 'var(--color-accent-hover)' }}
                    >
                        <RotateCcw className="h-4 w-4" /> Urungkan
                    </button>
                </div>
            )}

            {suggestions.length > 0 && !readOnly && (
                <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg)' }}>
                    <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--color-ink)' }}>
                        <Sparkles className="h-4 w-4" style={{ color: 'var(--color-accent)' }} /> Tambah dari saran
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((s, i) => {
                            const jenis = s.jenis === 'termasuk' ? 'termasuk' : 'addon';
                            const list = jenis === 'termasuk' ? termasuk : addon;
                            const disabled = list.length >= max;
                            return (
                                <button
                                    key={`${s.nama}-${i}`}
                                    type="button"
                                    disabled={disabled}
                                    onClick={() => addRow(jenis, { ...s, tipe })}
                                    className="rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50"
                                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-ink)', background: 'var(--color-surface)' }}
                                >
                                    + {s.nama}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {renderSection('termasuk', termasuk)}
            {renderSection('addon', addon)}

            <section
                className="rounded-2xl border p-4"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
                aria-label="Pratinjau pelanggan"
            >
                <h3 className="inline-flex items-center gap-1.5 font-display text-base font-bold" style={{ color: 'var(--color-ink)' }}>
                    <Eye className="h-4 w-4" style={{ color: 'var(--color-accent)' }} /> Pratinjau pelanggan
                </h3>
                <p className="mt-0.5 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                    Perkiraan dari server. Total resmi dihitung sistem saat pengajuan dikirim.
                </p>

                {!productId && (
                    <p className="mt-3 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                        Pilih layanan terlebih dahulu untuk melihat pratinjau.
                    </p>
                )}
                {productId && loading && (
                    <p className="mt-3 inline-flex items-center gap-2 text-[13px]" style={{ color: 'var(--color-muted)' }}>
                        <Loader2 className="h-4 w-4 animate-spin" /> Menghitung…
                    </p>
                )}
                {productId && !loading && previewError && (
                    <p className="mt-3 text-[13px]" role="alert" style={{ color: 'var(--color-danger)' }}>
                        {previewError}
                    </p>
                )}
                {productId && !loading && !previewError && preview && (
                    <dl className="mt-3 divide-y" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center justify-between gap-4 py-2 text-sm">
                            <dt style={{ color: 'var(--color-muted)' }}>Subtotal</dt>
                            <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{formatRupiah(preview.subtotal)}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-2 text-sm">
                            <dt style={{ color: 'var(--color-muted)' }}>PPN</dt>
                            <dd className="font-medium" style={{ color: 'var(--color-ink)' }}>{formatRupiah(preview.ppn)}</dd>
                        </div>
                        <div className="flex items-center justify-between gap-4 py-2 text-sm font-semibold">
                            <dt style={{ color: 'var(--color-ink)' }}>Total</dt>
                            <dd style={{ color: 'var(--color-accent-hover)' }} data-testid="preview-total">{formatRupiah(preview.total)}</dd>
                        </div>
                    </dl>
                )}
            </section>
        </div>
    );
}

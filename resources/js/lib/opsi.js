/**
 * Shared helpers for the "options & add-ons" feature (Workstream C).
 *
 * Mirrors App\Models\Opsi::SATUAN_BY_TIPE on the server: Ruangan may be
 * priced per day/hour/person, while Jasa and Produk are flat or per unit.
 * Also provides editor row factories used by OpsiEditor and the pages.
 */

export const SATUAN_BY_TIPE = {
    ruangan: ['flat', 'per_hari', 'per_jam', 'per_orang', 'per_unit'],
    jasa: ['flat', 'per_unit'],
    produk: ['flat', 'per_unit'],
};

/** Allowed units for a layanan type (jasa|ruangan|produk). */
export function satuanUntukTipe(tipe) {
    return SATUAN_BY_TIPE[tipe] ?? ['flat', 'per_unit'];
}

export const SATUAN_LABEL = {
    flat: 'Flat (sekali bayar)',
    per_hari: 'Per hari',
    per_jam: 'Per jam',
    per_orang: 'Per orang',
    per_unit: 'Per unit',
};

/** `{ value, label }[]` options for the ui-kit Select, limited by tipe. */
export function satuanOptions(tipe) {
    return satuanUntukTipe(tipe).map((value) => ({ value, label: SATUAN_LABEL[value] ?? value }));
}

let seq = 0;

/** Stable client-only key so React rows survive reordering. */
export function newOpsiKey() {
    seq += 1;
    return `opsi-${seq}`;
}

/**
 * Build a blank editor row.
 *
 * @param {'termasuk'|'addon'} jenis
 * @param {object} [over] field overrides (e.g. `{ tipe, nama, harga, satuan }`)
 */
export function emptyOpsiRow(jenis = 'addon', over = {}) {
    const tipe = over.tipe ?? 'jasa';
    const allowed = satuanUntukTipe(tipe);
    return {
        _key: newOpsiKey(),
        id: null,
        nama: '',
        deskripsi: '',
        satuan: allowed.includes(over.satuan) ? over.satuan : allowed[0],
        qty_min: 1,
        qty_max: null,
        stok: null,
        aktif: true,
        urutan: 0,
        ...over,
        // jenis and the free-item price rule must never be overridden away.
        jenis,
        harga: jenis === 'termasuk' ? 0 : Number(over.harga ?? 0),
    };
}

/** Normalize a persisted/server option row into an editor row. */
export function toOpsiRow(row, index = 0) {
    const jenis = row.jenis === 'termasuk' ? 'termasuk' : 'addon';
    const allowed = satuanUntukTipe(row.tipe ?? 'jasa');
    return {
        _key: newOpsiKey(),
        id: row.id ?? null,
        jenis,
        nama: row.nama ?? '',
        deskripsi: row.deskripsi ?? '',
        harga: jenis === 'termasuk' ? 0 : Number(row.harga ?? 0),
        satuan: allowed.includes(row.satuan) ? row.satuan : allowed[0],
        qty_min: row.qty_min ?? 1,
        qty_max: row.qty_max ?? null,
        stok: row.stok ?? null,
        aktif: row.aktif ?? true,
        urutan: row.urutan ?? index,
    };
}

/** Re-number rows per list (termasuk then addon) so `urutan` stays dense. */
export function renumberOpsi(rows) {
    const num = (jenis) =>
        rows.filter((r) => r.jenis === jenis).map((r, i) => ({ ...r, urutan: i }));
    return [...num('termasuk'), ...num('addon')];
}

/** Strip editor-only keys before an Inertia submit. */
export function serializeOpsi(rows) {
    return renumberOpsi(rows).map((r) => ({
        id: r.id ?? null,
        jenis: r.jenis,
        nama: r.nama,
        deskripsi: r.deskripsi || null,
        harga: r.jenis === 'termasuk' ? 0 : Number(r.harga ?? 0),
        satuan: r.satuan,
        qty_min: r.qty_min == null || r.qty_min === '' ? 1 : Number(r.qty_min),
        qty_max: r.qty_max == null || r.qty_max === '' ? null : Number(r.qty_max),
        stok: r.stok == null || r.stok === '' ? null : Number(r.stok),
        aktif: Boolean(r.aktif),
        urutan: r.urutan,
    }));
}

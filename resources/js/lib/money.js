/** Currency + number formatting. Money is always integer rupiah. */

export function formatNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '0';
    return new Intl.NumberFormat('id-ID').format(Math.round(n));
}

/** "Rp 1.250.000" */
export function formatRupiah(value) {
    return `Rp ${formatNumber(value)}`;
}

/** Parse any user string ("Rp 1.250.000", "1250000") into integer rupiah. */
export function parseRupiah(input) {
    const digits = String(input ?? '').replace(/[^0-9]/g, '');
    return digits === '' ? 0 : parseInt(digits, 10);
}

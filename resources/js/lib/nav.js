/**
 * Link helper. Every menu/link in the app goes through href(pageKey)
 * instead of raw route() calls that throw on missing names.
 * - Real named route exists  -> its URL.
 * - Otherwise in DEV        -> "?preview=<pageKey>&role=<role>".
 * - Otherwise (production)  -> "#".
 */
export const DESTINATIONS = {
    // real routes
    landing:        { route: 'home' },
    catalog:        { route: 'catalog.index' },
    'catalog.show': { route: 'catalog.show' },
    login:          { route: 'login' },
    register:       { route: 'register' },
    dashboard:      { route: 'dashboard' },
    logout:         { route: 'logout' },
    // preview-only pages (no backend route yet)
    'customer.pengajuan.create': { component: 'Customer/Pengajuan/Create' },
    'customer.pengajuan.index':  { component: 'Customer/Pengajuan/Index' },
    'customer.pengajuan.show':   { component: 'Customer/Pengajuan/Show' },
    'customer.pengajuan.edit':   { component: 'Customer/Pengajuan/Edit' },
    'customer.bayar':            { component: 'Customer/Pembayaran' },
    'customer.riwayat':          { component: 'Customer/Riwayat' },
    'rtpu.verify.layanan': { component: 'Rtpu/Verifikasi/Layanan' },
    'rtpu.verify.bayar':   { component: 'Rtpu/Verifikasi/Pembayaran' },
    'rtpu.status':         { component: 'Rtpu/StatusLayanan' },
    'rtpu.layanan':        { component: 'Rtpu/Layanan/Index' },
    'rtpu.layanan.form':   { component: 'Rtpu/Layanan/Form' },
    'rtpu.metode':         { component: 'Rtpu/MetodePembayaran/Index' },
    'rtpu.riwayat':        { component: 'Rtpu/Riwayat' },
    'p3m.produk.index':  { component: 'P3M/ProdukUnggulan/Index' },
    'p3m.produk.create': { component: 'P3M/ProdukUnggulan/Create' },
    'p3m.produk.show':   { component: 'P3M/ProdukUnggulan/Show' },
    'p3m.produk.edit':   { component: 'P3M/ProdukUnggulan/Edit' },
    'p3m.riwayat':       { component: 'P3M/Riwayat' },
    'pimpinan.verify':  { component: 'Pimpinan/Verifikasi' },
    'pimpinan.monitor': { component: 'Pimpinan/Pemantauan' },
    'pimpinan.riwayat': { component: 'Pimpinan/Riwayat' },
    'direktur.monitor': { component: 'Direktur/Pemantauan' },
    'direktur.riwayat': { component: 'Direktur/Riwayat' },
    'superadmin.users':    { component: 'SuperAdmin/Users/Index' },
    'superadmin.hakakses': { component: 'SuperAdmin/HakAkses' },
    'superadmin.fitur':    { component: 'SuperAdmin/Fitur/Index' },
};

export function hasRoute(name) {
    try {
        return typeof route === 'function' && route().has(name);
    } catch {
        return false;
    }
}

function previewUrl(pageKey, params = {}) {
    const q = new URLSearchParams({ preview: pageKey, ...params });
    return `?${q.toString()}`;
}

export function href(pageKey, params = {}, role = null) {
    const dest = DESTINATIONS[pageKey];
    if (!dest) return '#';
    if (dest.route && hasRoute(dest.route)) {
        try {
            return route(dest.route, params);
        } catch {
            /* fall through */
        }
    }
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        const r = role ?? params.role ?? 'customer';
        return previewUrl(pageKey, { ...params, role: r });
    }
    return '#';
}

export function componentFor(pageKey) {
    return DESTINATIONS[pageKey]?.component ?? null;
}

/**
 * Link helper. Every menu/link in the app goes through href(pageKey) using
 * real named routes. Returns '#' when the route is unavailable.
 */
export const DESTINATIONS = {
    landing:        { route: 'home' },
    catalog:        { route: 'catalog.index' },
    'catalog.show': { route: 'catalog.show' },
    login:          { route: 'login' },
    register:       { route: 'register' },
    dashboard:      { route: 'dashboard' },
    logout:         { route: 'logout' },
    'customer.pengajuan.index':  { route: 'customer.pengajuan.index' },
    'customer.pengajuan.create': { route: 'customer.pengajuan.create' },
    'customer.pengajuan.show':   { route: 'customer.pengajuan.show' },
    'customer.pengajuan.edit':   { route: 'customer.pengajuan.edit' },
    'customer.bayar':            { route: 'customer.pengajuan.bayar' },
    'customer.riwayat':          { route: 'customer.riwayat' },
    'rtpu.verify.layanan': { route: 'rtpu.verify.layanan' },
    'rtpu.verify.bayar':   { route: 'rtpu.verify.bayar' },
    'rtpu.status':         { route: 'rtpu.status' },
    'rtpu.layanan':        { route: 'rtpu.layanan' },
    'rtpu.layanan.form':   { route: 'rtpu.layanan.form' },
    'rtpu.metode':         { route: 'rtpu.metode' },
    'rtpu.riwayat':        { route: 'rtpu.riwayat' },
    'p3m.produk.index':  { route: 'p3m.produk.index' },
    'p3m.produk.create': { route: 'p3m.produk.create' },
    'p3m.produk.show':   { route: 'p3m.produk.show' },
    'p3m.produk.edit':   { route: 'p3m.produk.edit' },
    'p3m.riwayat':       { route: 'p3m.riwayat' },
    'pimpinan.verify':  { route: 'pimpinan.verify' },
    'pimpinan.monitor': { route: 'pimpinan.monitor' },
    'pimpinan.riwayat': { route: 'pimpinan.riwayat' },
    'direktur.monitor': { route: 'direktur.monitor' },
    'direktur.riwayat': { route: 'direktur.riwayat' },
    'superadmin.users':    { route: 'superadmin.users' },
    'superadmin.hakakses': { route: 'superadmin.hakakses' },
    'superadmin.fitur':    { route: 'superadmin.fitur' },
};

export function hasRoute(name) {
    try {
        return typeof route === 'function' && route().has(name);
    } catch {
        return false;
    }
}

export function href(pageKey, params = {}) {
    const dest = DESTINATIONS[pageKey];
    if (!dest?.route || !hasRoute(dest.route)) return '#';
    try {
        return route(dest.route, params);
    } catch {
        return '#';
    }
}

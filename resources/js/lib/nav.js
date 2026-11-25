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
    'calendar.master': { route: 'calendar.master' },
    logout:         { route: 'logout' },
    'customer.pengajuan.index':  { route: 'customer.pengajuan.index' },
    'customer.pengajuan.create': { route: 'customer.pengajuan.create' },
    'customer.pengajuan.show':   { route: 'customer.pengajuan.show' },
    'customer.pengajuan.edit':   { route: 'customer.pengajuan.edit' },
    'customer.bayar':            { route: 'customer.pengajuan.bayar' },
    'customer.riwayat':          { route: 'customer.riwayat' },
    'rtpu.dashboard':      { route: 'rtpu.dashboard' },
    'rtpu.verify.akun':    { route: 'rtpu.verify.akun' },
    'rtpu.verify.layanan': { route: 'rtpu.verify.layanan' },
    'rtpu.verify.produk':  { route: 'rtpu.verify.produk' },
    'rtpu.verify.bayar':   { route: 'rtpu.verify.bayar' },
    'rtpu.status':         { route: 'rtpu.status' },
    'rtpu.pesanan.index':  { route: 'rtpu.pesanan.index' },
    'rtpu.layanan':        { route: 'rtpu.layanan' },
    'rtpu.layanan.form':   { route: 'rtpu.layanan.form' },
    'rtpu.layanan.edit':   { route: 'rtpu.layanan.edit' },
    'rtpu.metode':         { route: 'rtpu.metode' },
    'rtpu.riwayat':        { route: 'rtpu.riwayat' },
    'rtpu.reports':        { route: 'rtpu.reports' },
    'p3m.produk.index':  { route: 'p3m.produk.index' },
    'p3m.produk.show':   { route: 'p3m.produk.show' },
    'p3m.produk.edit':   { route: 'p3m.produk.edit' },
    'p3m.riwayat':       { route: 'p3m.riwayat' },
    'p3m.dashboard':     { route: 'p3m.dashboard' },
    'pimpinan.verify.akun': { route: 'pimpinan.verify.akun' },
    'pimpinan.verify.produk': { route: 'pimpinan.verify.produk' },
    'pimpinan.verify':  { route: 'pimpinan.verify' },
    'pimpinan.monitor': { route: 'pimpinan.monitor' },
    'pimpinan.riwayat': { route: 'pimpinan.riwayat' },
    'pimpinan.reports': { route: 'pimpinan.reports' },
    'pimpinan.dashboard': { route: 'pimpinan.dashboard' },
    'direktur.monitor': { route: 'direktur.monitor' },
    'direktur.monitoring-pesanan': { route: 'direktur.monitoring-pesanan' },
    'direktur.riwayat': { route: 'direktur.riwayat' },
    'direktur.dashboard': { route: 'direktur.dashboard' },
    'pengelola.dashboard': { route: 'pengelola.dashboard' },
    'pengelola.produk.index': { route: 'pengelola.produk.index' },
    'pengelola.pesanan.index': { route: 'pengelola.pesanan.index' },
    'superadmin.dashboard': { route: 'superadmin.dashboard' },
    'superadmin.users':    { route: 'superadmin.users' },
    'superadmin.hakakses': { route: 'superadmin.hakakses' },
    'superadmin.fitur':    { route: 'superadmin.fitur' },
    'superadmin.kategori.index': { route: 'superadmin.kategori.index' },
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
